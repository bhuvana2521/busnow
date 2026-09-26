const mongoose = require("mongoose");

const RouteSchema = new mongoose.Schema({
  routeNumber: { type: String, required: true },
  routeName: { type: String },
  stops: [
    {
      stopName: String,
      lat: Number,
      lng: Number,
      order: Number
    }
  ]
});

module.exports = mongoose.model("Route", RouteSchema);