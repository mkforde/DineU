const mongoose = require('mongoose');

const PartySchema = new mongoose.Schema({
  members: [{
    type: String,  // might wanna change this to ObjectId when we implement user authentication
    required: true
  }],
  diningHallName: {
    type: String,
    required: true
  },
  tableSize: {
    type: Number,
    required: true,
    min: 1
  },
  topicOfDiscussion: {
    type: String,
    required: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Party', PartySchema); 