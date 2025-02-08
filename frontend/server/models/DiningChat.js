const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DiningChatSchema = new mongoose.Schema({
  diningHall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiningHall',
    required: true
  },
  messages: [MessageSchema],
  activeUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Update lastActivity when new messages are added
DiningChatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
  next();
});

// Index for efficient queries
DiningChatSchema.index({ diningHall: 1, lastActivity: -1 });

module.exports = mongoose.model('DiningChat', DiningChatSchema); 