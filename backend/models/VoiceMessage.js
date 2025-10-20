const mongoose = require('mongoose');

const VoiceMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  audioUrl: {
    type: String,
    required: true,
  },
  lifespan: {
    type: String,
    enum: ['3m', '3h', '3d'], // 3 minutes, 3 hours, 3 days
    default: '3h', // Default to 3 hours
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

// TTL index on expiresAt field
VoiceMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Remove the pre-save hook as expiresAt is now set in the controller
// VoiceMessageSchema.pre('save', function(next) {
//   if (this.isNew || this.isModified('lifespan')) {
//     const now = new Date();
//     let expirationTime;
//     switch (this.lifespan) {
//       case '3m':
//         expirationTime = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes
//         break;
//       case '3h':
//         expirationTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours
//         break;
//       case '3d':
//         expirationTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
//         break;
//       default:
//         expirationTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Default to 3 hours
//     }
//     this.expiresAt = expirationTime;
//   }
//   next();
// });

module.exports = mongoose.model('VoiceMessage', VoiceMessageSchema);