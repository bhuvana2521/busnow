const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
require("dotenv").config();

// Fix SRV DNS resolution on Windows (no effect on Linux/Render)
try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch(e) {}

const Bus = require("./models/Bus");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// Connect MongoDB with retry
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.log("❌ MongoDB Error:", err.message);
    console.log("🔄 Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Routes
app.use("/api/buses", require("./routes/buses"));
app.use("/api/routes", require("./routes/routes"));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// Socket.io — Real-time location + DB persistence
io.on("connection", (socket) => {
  console.log("🚌 Client connected:", socket.id);

  // Driver goes live and sends location
  socket.on("driver:location", async (data) => {
    try {
      const { busId, routeNumber, location, crowdLevel, driverName, routeName } = data;

      if (!busId || !location) return;

      // Persist to MongoDB (upsert — create or update)
      const updated = await Bus.findOneAndUpdate(
        { busId },
        {
          busId,
          routeNumber: routeNumber || "N/A",
          routeName: routeName || `Route ${routeNumber}`,
          driverName: driverName || "Unknown Driver",
          location: {
            lat: location.lat,
            lng: location.lng
          },
          crowdLevel: crowdLevel || "empty",
          isLive: true,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      // Broadcast to all clients
      io.emit("bus:location:update", {
        busId,
        location: updated.location,
        crowdLevel: updated.crowdLevel,
        routeNumber: updated.routeNumber,
        routeName: updated.routeName,
        driverName: updated.driverName,
        isLive: true,
        lastUpdated: updated.lastUpdated
      });

      // Store busId on socket for disconnect cleanup
      socket.busId = busId;
    } catch (err) {
      console.error("driver:location error:", err.message);
    }
  });

  // Driver updates crowd level
  socket.on("driver:crowd", async (data) => {
    try {
      const { busId, crowdLevel } = data;
      if (!busId) return;

      await Bus.findOneAndUpdate({ busId }, { crowdLevel, lastUpdated: new Date() });
      io.emit("bus:crowd:update", { busId, crowdLevel });
    } catch (err) {
      console.error("driver:crowd error:", err.message);
    }
  });

  // Driver manually ends shift
  socket.on("driver:offline", async (data) => {
    try {
      const { busId } = data;
      if (!busId) return;

      await Bus.findOneAndUpdate({ busId }, { isLive: false, lastUpdated: new Date() });
      io.emit("bus:offline", { busId });
    } catch (err) {
      console.error("driver:offline error:", err.message);
    }
  });

  // Auto-mark bus offline on socket disconnect
  socket.on("disconnect", async () => {
    console.log("❌ Client disconnected:", socket.id);
    if (socket.busId) {
      try {
        await Bus.findOneAndUpdate(
          { busId: socket.busId },
          { isLive: false, lastUpdated: new Date() }
        );
        io.emit("bus:offline", { busId: socket.busId });
      } catch (err) {
        console.error("disconnect cleanup error:", err.message);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
