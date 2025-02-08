const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  dietaryInfo: [{
    type: String,
    enum: ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free']
  }],
  allergens: [{
    type: String
  }],
  mealPeriod: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'LateNight']
  },
  available: {
    type: Boolean,
    default: true
  }
});

const DiningHallSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 0
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Open', 'Closed', 'At Capacity'],
    default: 'Closed'
  },
  operatingHours: {
    breakfast: {
      start: String,
      end: String
    },
    lunch: {
      start: String,
      end: String
    },
    dinner: {
      start: String,
      end: String
    },
    lateNight: {
      start: String,
      end: String
    }
  },
  menu: {
    type: Map,
    of: [MenuItemSchema]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DiningHall', DiningHallSchema);