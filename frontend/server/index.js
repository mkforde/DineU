const express = require('express');
const cors = require('cors');
const menuRouter = require('./menuScraper');
const occupancyRoutes = require('./occupancyRoutes');
const directoryRoutes = require('./directoryScraper');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Middleware to attach supabase client to requests
app.use((req, res, next) => {
    req.supabase = supabase;
    next();
});

// Routes
app.use('/api/dining', menuRouter);
app.use('/api/occupancy', occupancyRoutes);
app.use('/api/directory', directoryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 