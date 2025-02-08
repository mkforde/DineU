const express = require('express');
const router = express.Router();
const Table = require('../models/Table');

// Get all unlocked tables
router.get('/available', async (req, res) => {
  try {
    const availableTables = await Table.find({ isLocked: false });
    res.json(availableTables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new table
router.post('/', async (req, res) => {
  const table = new Table({
    members: req.body.members,
    diningHallName: req.body.diningHallName,
    tableSize: req.body.tableSize,
    topicOfDiscussion: req.body.topicOfDiscussion,
    isLocked: req.body.isLocked || false
  });

  try {
    const newTable = await table.save();
    res.status(201).json(newTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Join a table
router.patch('/:id/join', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    if (table.isLocked) return res.status(400).json({ message: 'Table is locked' });
    if (table.members.length >= table.tableSize) {
      return res.status(400).json({ message: 'Table is full' });
    }

    const newMember = req.body.memberId;
    if (table.members.includes(newMember)) {
      return res.status(400).json({ message: 'Member already at table' });
    }

    table.members.push(newMember);
    const updatedTable = await table.save();
    res.json(updatedTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Lock/Unlock a table
router.patch('/:id/toggle-lock', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    table.isLocked = !table.isLocked;
    const updatedTable = await table.save();
    res.json(updatedTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a table
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });

    await table.deleteOne();
    res.json({ message: 'Table deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 

// # Create a table
// curl -X POST http://localhost:3000/api/tables \
// -H "Content-Type: application/json" \
// -d '{"members": ["user1"], "diningHallName": "North Dining", "tableSize": 4, "topicOfDiscussion": "AI and Ethics"}'

// # Join a table
// curl -X PATCH http://localhost:3000/api/tables/[tableId]/join \
// -H "Content-Type: application/json" \
// -d '{"memberId": "user2"}'

// # Toggle lock
// curl -X PATCH http://localhost:3000/api/tables/[tableId]/toggle-lock \
// -H "Content-Type: application/json"

// # Delete a table
// curl -X DELETE http://localhost:3000/api/tables/[tableId] 