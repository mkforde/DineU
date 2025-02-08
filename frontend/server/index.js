const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const menuRoutes = require('./menuScraper');
const occupancyRoutes = require('./occupancyRoutes');
const tableRoutes = require('./routes/tableRoutes');
const userRoutes = require('./routes/userRoutes');
const diningHallRoutes = require('./routes/diningHallRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/occupancy', occupancyRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dining-halls', diningHallRoutes);
app.use('/api/groups', groupRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 