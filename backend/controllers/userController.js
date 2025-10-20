const User = require('../models/User');
const VoiceMessage = require('../models/VoiceMessage');
const fs = require('fs');
const { useCloudinary, cloudinary } = require('../middleware/profileUpload');

// @desc    Search for users by email
// @route   GET /users/search?email=
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }

    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      _id: { $ne: req.user.id } // Exclude current user
    }).select('-googleId -createdAt -__v');

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get list of friends (users with whom messages have been exchanged)
// @route   GET /users/friends
// @access  Private
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find unique user IDs that the current user has exchanged messages with
    const friendMessageRecords = await VoiceMessage.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .select('senderId receiverId')
      .lean();

    const friendIds = new Set();
    friendMessageRecords.forEach((record) => {
      if (record.senderId.toString() !== userId.toString()) {
        friendIds.add(record.senderId.toString());
      }
      if (record.receiverId.toString() !== userId.toString()) {
        friendIds.add(record.receiverId.toString());
      }
    });

    const friends = await User.find({
      _id: { $in: Array.from(friendIds) },
    })
      .select('-googleId -createdAt -__v')
      .skip(skip)
      .limit(limit);

    const totalFriends = await User.countDocuments({
      _id: { $in: Array.from(friendIds) },
    });

    res.json({
      friends,
      currentPage: page,
      totalPages: Math.ceil(totalFriends / limit),
      totalFriends,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user by ID
// @route   GET /users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-googleId -createdAt -__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user profile (name and profile photo)
// @route   PUT /users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    let profilePhoto = req.body.profilePhoto; // For Google default photo or existing Cloudinary URL

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) {
      user.name = name;
    }

    if (req.file) {
      // If a new file is uploaded (local or Cloudinary)
      if (useCloudinary) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'profile_photos',
          width: 150,
          height: 150,
          crop: 'fill',
        });
        profilePhoto = result.secure_url;
        // Delete local temp file after upload to Cloudinary
        fs.unlinkSync(req.file.path);
      } else {
        profilePhoto = `/uploads/profiles/${req.file.filename}`;
      }
    } else if (profilePhoto && profilePhoto.startsWith('http')) {
      // If a Google default photo URL is provided and no new file is uploaded
      user.profilePhoto = profilePhoto;
    }

    if (profilePhoto) {
      user.profilePhoto = profilePhoto;
    }

    await user.save();

    res.json({
      _id: user._id,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};