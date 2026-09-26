const express = require("express");
const router = express.Router();
const Route = require("../models/Route");

// GET all routes
router.get("/", async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single route
router.get("/:id", async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create route
router.post("/", async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE route
router.delete("/:id", async (req, res) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ message: "Route deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;