const express = require("express");
const router = express.Router();
const Bus = require("../models/Bus");

// GET all live buses (for passengers)
router.get("/", async (req, res) => {
  try {
    const buses = await Bus.find({ isLive: true });
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all buses regardless of status (for admin)
router.get("/all", async (req, res) => {
  try {
    const buses = await Bus.find().sort({ lastUpdated: -1 });
    res.json(buses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single bus
router.get("/:busId", async (req, res) => {
  try {
    const bus = await Bus.findOne({ busId: req.params.busId });
    if (!bus) return res.status(404).json({ error: "Bus not found" });
    res.json(bus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create bus
router.post("/", async (req, res) => {
  try {
    const bus = new Bus(req.body);
    await bus.save();
    res.status(201).json(bus);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update location
router.patch("/:busId/location", async (req, res) => {
  try {
    const bus = await Bus.findOneAndUpdate(
      { busId: req.params.busId },
      { location: req.body.location, isLive: true, lastUpdated: Date.now() },
      { new: true }
    );
    if (!bus) return res.status(404).json({ error: "Bus not found" });
    res.json(bus);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update crowd
router.patch("/:busId/crowd", async (req, res) => {
  try {
    const bus = await Bus.findOneAndUpdate(
      { busId: req.params.busId },
      { crowdLevel: req.body.crowdLevel },
      { new: true }
    );
    if (!bus) return res.status(404).json({ error: "Bus not found" });
    res.json(bus);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE bus
router.delete("/:busId", async (req, res) => {
  try {
    await Bus.findOneAndDelete({ busId: req.params.busId });
    res.json({ message: "Bus deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST seed demo data
router.post("/seed/demo", async (req, res) => {
  try {
    const demoBuses = [
      {
        busId: "BUS-001",
        routeNumber: "12",
        routeName: "Central → Airport",
        driverName: "Ahmed Al-Rashid",
        isLive: true,
        location: { lat: 11.0168, lng: 76.9558 },
        crowdLevel: "half"
      },
      {
        busId: "BUS-002",
        routeNumber: "7",
        routeName: "Harbor → University",
        driverName: "Sara Hassan",
        isLive: true,
        location: { lat: 11.0220, lng: 76.9600 },
        crowdLevel: "empty"
      },
      {
        busId: "BUS-003",
        routeNumber: "24",
        routeName: "Market → Stadium",
        driverName: "Omar Khalid",
        isLive: true,
        location: { lat: 11.0100, lng: 76.9450 },
        crowdLevel: "full"
      },
      {
        busId: "BUS-004",
        routeNumber: "5",
        routeName: "North Gate → South Mall",
        driverName: "Fatima Noor",
        isLive: false,
        location: { lat: 11.0050, lng: 76.9700 },
        crowdLevel: "empty"
      }
    ];

    for (const demo of demoBuses) {
      await Bus.findOneAndUpdate(
        { busId: demo.busId },
        demo,
        { upsert: true, new: true }
      );
    }

    res.json({ message: "Demo data seeded", count: demoBuses.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
