const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  members: [{
    type: String,  // might wanna change this to ObjectId when we implement user authentication
    required: true
  }],
  owner: {
    type: String, // will be the ID of the user who created the table
    required: true
  },
  diningHallName: {
    type: String,
    required: true
  },
  tableSize: {
    type: Number,
    required: true,
    min: 1
  },
  vibe: {
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
  },
  pin: {
    type: String,
    required: true,
    unique: true,
    default: () => `do2${Math.floor(10 + Math.random() * 90).toString()}` // generates do2XX format
  }
});

// Add a pre-save hook to ensure unique PIN
TableSchema.pre('save', async function(next) {
  if (this.isNew) {
    let pinExists = true;
    while (pinExists) {
      const pin = `do2${Math.floor(10 + Math.random() * 90).toString()}`; // generates do2XX format
      pinExists = await this.constructor.findOne({ pin });
      if (!pinExists) {
        this.pin = pin;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Table', TableSchema); 