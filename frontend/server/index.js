const express = require('express');
const cors = require('cors');
const menuRoutes = require('./menuScraper');
const occupancyRoutes = require('./occupancyRoutes');
const directoryRoutes = require('./directoryScraper');

const app = express();
app.use(cors());

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/occupancy', occupancyRoutes);
app.use('/api/directory', directoryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 