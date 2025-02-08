const express = require('express');
const router = express.Router();
const Party = require('../models/Party');

// Get all parties
router.get('/', async (req, res) => {
  try {
    const parties = await Party.find();
    res.json(parties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new party
router.post('/', async (req, res) => {
  const party = new Party({
    members: req.body.members,
    diningHallName: req.body.diningHallName,
    tableSize: req.body.tableSize,
    topicOfDiscussion: req.body.topicOfDiscussion,
    isLocked: req.body.isLocked || false
  });

  try {
    const newParty = await party.save();
    res.status(201).json(newParty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Join a party
router.patch('/:id/join', async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) return res.status(404).json({ message: 'Party not found' });
    if (party.isLocked) return res.status(400).json({ message: 'Party is locked' });
    if (party.members.length >= party.tableSize) {
      return res.status(400).json({ message: 'Party is full' });
    }

    const newMember = req.body.memberId;
    if (party.members.includes(newMember)) {
      return res.status(400).json({ message: 'Member already in party' });
    }

    party.members.push(newMember);
    const updatedParty = await party.save();
    res.json(updatedParty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Lock/Unlock a party
router.patch('/:id/toggle-lock', async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) return res.status(404).json({ message: 'Party not found' });

    party.isLocked = !party.isLocked;
    const updatedParty = await party.save();
    res.json(updatedParty);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a party
router.delete('/:id', async (req, res) => {
  try {
    const party = await Party.findById(req.params.id);
    if (!party) return res.status(404).json({ message: 'Party not found' });

    await party.deleteOne();
    res.json({ message: 'Party deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 