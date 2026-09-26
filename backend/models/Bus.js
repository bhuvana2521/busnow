const mongoose = require("mongoose");

const BusSchema = new mongoose.Schema({
  busId: { type: String, required: true, unique: true },
  routeNumber: { type: String, required: true },
  routeName: { type: String },
  driverName: { type: String },
  isLive: { type: Boolean, default: false },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },
  crowdLevel: {
    type: String,
    enum: ["empty", "half", "full"],
    default: "empty"
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Bus", BusSchema);