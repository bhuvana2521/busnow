import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import socket from "../socket";

const API = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : "http://localhost:5000/api";

export function useLiveBuses({ fetchAll = false } = {}) {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const endpoint = fetchAll ? `${API}/buses/all` : `${API}/buses`;

  const fetchBuses = useCallback(() => {
    setLoading(true);
    axios.get(endpoint)
      .then(res => {
        setBuses(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [endpoint]);

  // Initial fetch
  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  // Real-time socket updates
  useEffect(() => {
    // Live location update — upsert bus into state
    socket.on("bus:location:update", (data) => {
      setBuses(prev => {
        const exists = prev.find(b => b.busId === data.busId);
        if (exists) {
          return prev.map(bus =>
            bus.busId === data.busId
              ? {
                  ...bus,
                  location: data.location,
                  crowdLevel: data.crowdLevel || bus.crowdLevel,
                  driverName: data.driverName || bus.driverName,
                  routeName: data.routeName || bus.routeName,
                  isLive: true,
                  lastUpdated: data.lastUpdated || new Date()
                }
              : bus
          );
        } else {
          // New bus appeared — add it to list
          return [...prev, {
            busId: data.busId,
            routeNumber: data.routeNumber,
            routeName: data.routeName || `Route ${data.routeNumber}`,
            driverName: data.driverName || "Driver",
            location: data.location,
            crowdLevel: data.crowdLevel || "empty",
            isLive: true,
            lastUpdated: data.lastUpdated || new Date()
          }];
        }
      });
    });

    // Crowd level update
    socket.on("bus:crowd:update", (data) => {
      setBuses(prev => prev.map(bus =>
        bus.busId === data.busId
          ? { ...bus, crowdLevel: data.crowdLevel }
          : bus
      ));
    });

    // Bus went offline — match by busId (not socketId)
    socket.on("bus:offline", (data) => {
      setBuses(prev => prev.map(bus =>
        bus.busId === data.busId
          ? { ...bus, isLive: false }
          : bus
      ));
    });

    return () => {
      socket.off("bus:location:update");
      socket.off("bus:crowd:update");
      socket.off("bus:offline");
    };
  }, []);

  return { buses, loading, error, refetch: fetchBuses };
}
