const VoiceMessage = require('../models/VoiceMessage');
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');

const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

const deleteExpiredMessages = async () => {
  try {
    const now = new Date();
    // Find messages where expiresAt is less than or equal to the current time
    const expiredMessages = await VoiceMessage.find({ expiresAt: { $lte: now } });

    for (const message of expiredMessages) {
      if (useCloudinary) {
        // Extract public ID from Cloudinary URL
        const publicId = message.audioUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`voice_messages/${publicId}`, { resource_type: 'video' });
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
    console.log(`${expiredMessages.length} expired messages deleted from cron job.`);
  } catch (error) {
    console.error('Error deleting expired messages:', error);
  }
};

module.exports = deleteExpiredMessages;