const mongoose = require('mongoose');
const VoiceMessage = require('../models/VoiceMessage');
const User = require('../models/User'); // Import User model
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const { getIo } = require('../socket');
const { sendPushNotification } = require('./pushController');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

// @desc    Send a voice message
// @route   POST /messages/send
// @access  Private
exports.sendVoiceMessage = async (req, res) => {
  try {
    const { receiverId } = req.body;
    let { lifespan } = req.body; // Use let to allow modification
    const senderId = req.user.id;

    // Ensure lifespan has a default value if not provided or invalid
    if (!['3m', '3h', '3d'].includes(lifespan)) {
      lifespan = '3h'; // Default to 3 hours
    }

    const now = new Date();
    // Initially, messages expire in 7 days if unread
    const initialExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    let audioUrl;
    let filePath = req.file.path;

    if (useCloudinary) {
      // Upload audio to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        folder: 'voice_messages',
        format: 'wav', // Explicitly set format to WAV
      });
      audioUrl = result.secure_url;
      // Delete the local file after uploading to Cloudinary
      fs.unlinkSync(filePath);
    } else {
      // Convert to WAV for local storage if not already WAV
      const originalExt = path.extname(filePath).toLowerCase();
      if (originalExt !== '.wav') {
        const outputFileName = `${path.basename(filePath, originalExt)}.wav`;
        const outputPath = path.join(path.dirname(filePath), outputFileName);

        await new Promise((resolve, reject) => {
          ffmpeg(filePath)
            .audioCodec('pcm_s16le') // Explicitly set codec to PCM 16-bit Little-Endian
            .toFormat('wav')
            .on('error', (err) => {
              console.error('FFmpeg conversion error:', err);
              // Attempt to delete the partially created output file if an error occurs
              if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
              }
              reject(err);
            })
            .on('end', () => {
              console.log(`FFmpeg conversion finished: ${filePath} -> ${outputPath}`);
              fs.unlinkSync(filePath); // Delete original file
              filePath = outputPath; // Update filePath to the new WAV file
              resolve();
            })
            .save(outputPath);
        });
      }
      // Use local storage
      const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      audioUrl = `${backendUrl}/uploads/${path.basename(filePath)}`;
    }

    const createdVoiceMessage = await VoiceMessage.create({
      senderId,
      receiverId,
      audioUrl,
      lifespan, // Store the sender's chosen lifespan
      expiresAt: initialExpiresAt, // Initial expiration for unread messages
      isRead: false, // Mark as unread initially
    });

    // Fetch the newly created message and populate sender and receiver details before emitting
    const voiceMessage = await VoiceMessage.findById(createdVoiceMessage._id)
      .populate('senderId', 'name profileImage profilePhoto')
      .populate('receiverId', 'name profileImage profilePhoto');

    // Emit real-time message
    const io = getIo(); // Get the Socket.io instance
    // Emit to the receiver's room
    io.to(receiverId).emit('newVoiceMessage', voiceMessage);
    // Emit to the sender's room to update their UI immediately
    io.to(senderId).emit('newVoiceMessage', voiceMessage);
    // Emit unread counts to both sender and receiver after a new message is sent
    io.to(receiverId).emit('unreadCountsUpdated');
    io.to(senderId).emit('unreadCountsUpdated');

    // Send push notification to the receiver
    const payload = {
      title: `New Voice Message from ${voiceMessage.senderId.name}`,
      body: 'Tap to listen!',
      icon: voiceMessage.senderId.profilePhoto || voiceMessage.senderId.profileImage || 'https://placehold.co/192x192/7DD3FC/111827.png?text=SEVO&font=Raleway',
      data: {
        url: `/chat/${voiceMessage.senderId._id}`, // URL to open when notification is clicked
        senderId: voiceMessage.senderId._id,
      },
    };
    await sendPushNotification(receiverId, payload);

    res.status(201).json(voiceMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Mark a voice message as read and update its lifespan
// @route   PUT /messages/:id/read
// @access  Private
exports.markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // User who is marking the message as read

    const message = await VoiceMessage.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only the receiver can mark a message as read
    if (message.receiverId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }

    if (!message.isRead) {
      message.isRead = true;

      // Recalculate expiresAt based on the sender's chosen lifespan
      const now = new Date();
      let expirationTime;
      switch (message.lifespan) {
        case '3m':
          expirationTime = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes
          break;
        case '3h':
          expirationTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours
          break;
        case '3d':
          expirationTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
          break;
        default:
          expirationTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Default to 3 hours
      }
      message.expiresAt = expirationTime;

      await message.save();

      // Emit socket event to notify sender/receiver that message is read and lifespan updated
      const io = getIo();
      io.to(message.senderId.toString()).emit('messageRead', message);
      io.to(message.receiverId.toString()).emit('messageRead', message);
      // Emit unread counts to both sender and receiver after a message is read
      // This will trigger a re-fetch of unread counts on the frontend
      io.to(message.senderId.toString()).emit('unreadCountsUpdated');
      io.to(message.receiverId.toString()).emit('unreadCountsUpdated');
    }

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch all messages between sender and receiver
// @route   GET /messages/:receiverId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.params;
    console.log(`[getMessages] Called with receiverId: ${receiverId}, senderId: ${senderId}`);

    const messages = await VoiceMessage.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
      .populate('senderId', 'name profileImage profilePhoto') // Populate sender details
      .populate('receiverId', 'name profileImage profilePhoto') // Populate receiver details
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get unread message counts for all friends
// @route   GET /messages/unreadCounts
// @access  Private
exports.getUnreadMessageCounts = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`[getUnreadMessageCounts] Called for userId: ${userId}`);

    const unreadCounts = await VoiceMessage.aggregate([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(userId),
          isRead: false,
          expiresAt: { $gt: new Date() }, // Only count messages that haven't expired
        },
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert array to a map for easier lookup
    const unreadCountsMap = unreadCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    res.json(unreadCountsMap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete expired messages (used by cron)
// @route   DELETE /messages/expired
// @access  Private (internal use by cron job)
exports.deleteExpiredMessages = async (req, res) => {
  try {
    const now = new Date();
    // Find messages where expiresAt is less than or equal to the current time
    const expiredMessages = await VoiceMessage.find({ expiresAt: { $lte: now } });

    for (const message of expiredMessages) {
      if (useCloudinary) {
        // Extract public ID from Cloudinary URL
        const publicId = message.audioUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`voice_messages/${publicId}`);
      } else {
        // Delete local file
        // The audioUrl stored is a full URL, need to extract the path relative to the uploads folder
        const filename = path.basename(message.audioUrl);
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      await message.deleteOne(); // Use deleteOne() instead of remove() for Mongoose 6+
    }

    res.json({ message: `${expiredMessages.length} expired messages deleted` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};