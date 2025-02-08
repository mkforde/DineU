const express = require('express');
const cors = require('cors');
const menuRouter = require('./menuScraper');
const occupancyRoutes = require('./occupancyRoutes');
const directoryRoutes = require('./directoryScraper');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());

// Initialize Supabase client using same config as frontend
const supabase = createClient(
    'https://eilgfvfxoaptkbqirdmj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbGdmdmZ4b2FwdGticWlyZG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMzMzNzksImV4cCI6MjA1NDYwOTM3OX0.ctCqhZDGK8l1Xb5cR8uhaBBjI7bWydAUF5iFN1QoxSs'
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