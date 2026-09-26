import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useLiveBuses } from "../../hooks/useLiveBuses";
import "leaflet/dist/leaflet.css";
import "./PassengerApp.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl:       require("leaflet/dist/images/marker-icon.png"),
  shadowUrl:     require("leaflet/dist/images/marker-shadow.png"),
});

const crowdColors = {
  empty: "#1DB954",
  half:  "#FFB800",
  full:  "#FF3B30"
};

const crowdLabels = {
  empty: "Empty",
  half:  "Half Full",
  full:  "Full"
};

const crowdEmoji = {
  empty: "🟢",
  half:  "🟡",
  full:  "🔴"
};

function getETA(busLocation, destLat, destLng) {
  if (!busLocation || !busLocation.lat) return null;
  const R = 6371;
  const dLat = ((destLat - busLocation.lat) * Math.PI) / 180;
  const dLng = ((destLng - busLocation.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((busLocation.lat * Math.PI) / 180) *
    Math.cos((destLat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const mins = (dist / 20) * 60;
  if (mins < 1) return "Now";
  if (mins > 60) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins)}m`;
}

// Re-center map when selected bus changes
function MapFlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1 });
  }, [position, map]);
  return null;
}

const DEFAULT_CENTER = [11.0168, 76.9558]; // Coimbatore

const NAVS = ["Map", "Routes", "Alerts", "Profile"];

export default function PassengerApp() {
  const navigate = useNavigate();
  const { buses, loading } = useLiveBuses();
  const [selected, setSelected]   = useState(null);
  const [search, setSearch]       = useState("");
  const [activeNav, setActiveNav] = useState("Map");
  const [mapCenter, setMapCenter] = useState(null);

  const filteredBuses = buses.filter(bus => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      bus.routeNumber?.toLowerCase().includes(q) ||
      bus.routeName?.toLowerCase().includes(q)   ||
      bus.driverName?.toLowerCase().includes(q)
    );
  });

  const handleCardClick = (bus) => {
    setSelected(bus);
    if (bus.location?.lat) {
      setMapCenter([bus.location.lat, bus.location.lng]);
    }
  };

  return (
    <div className="passenger-app">
      {/* Header */}
      <header className="p-header">
        <div className="p-header-top">
          <button className="p-back" onClick={() => navigate("/")}>Back</button>
          <div className="p-logo">Bus<span>Now</span></div>
          <div className="live-badge">
            <div className="live-dot"></div>
            LIVE
          </div>
        </div>
        <input
          className="p-search"
          placeholder="Search route number or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </header>

      {/* Map */}
      <div className="p-map">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />
          {mapCenter && <MapFlyTo position={mapCenter} />}
          {buses.map(bus =>
            bus.location?.lat ? (
              <Marker
                key={bus.busId}
                position={[bus.location.lat, bus.location.lng]}
                eventHandlers={{ click: () => handleCardClick(bus) }}
              >
                <Popup>
                  <strong>Bus #{bus.routeNumber}</strong><br />
                  {bus.routeName}<br />
                  {crowdEmoji[bus.crowdLevel]} {crowdLabels[bus.crowdLevel]}<br />
                  <span style={{ fontSize: "0.8em", color: "#888" }}>
                    Driver: {bus.driverName}
                  </span>
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>

      {/* Bus Cards / Routes / Alerts / Profile */}
      <div className="p-cards">
        {activeNav === "Map" && (
          <>
            <div className="p-section-label">
              {search ? `Results for "${search}"` : "Live Buses"}
              {!loading && (
                <span className="p-bus-count">{filteredBuses.filter(b => b.isLive).length} live</span>
              )}
            </div>

            {loading && <div className="p-loading">Loading buses...</div>}

            {!loading && filteredBuses.length === 0 && (
              <div className="p-empty">
                {search ? "No buses match your search" : "No live buses right now"}
              </div>
            )}

            {filteredBuses.map(bus => (
              <div
                key={bus.busId}
                className={`bus-card ${selected?.busId === bus.busId ? "selected" : ""} ${!bus.isLive ? "offline" : ""}`}
                onClick={() => handleCardClick(bus)}
              >
                <div className="bc-top">
                  <div className="bc-left">
                    <div className="route-badge" style={{ background: crowdColors[bus.crowdLevel] }}>
                      {bus.routeNumber}
                    </div>
                    <div>
                      <div className="route-name">{bus.routeName}</div>
                      <div className="route-sub">
                        {bus.isLive ? (
                          getETA(bus.location, DEFAULT_CENTER[0], DEFAULT_CENTER[1]) !== null
                            ? `~${getETA(bus.location, DEFAULT_CENTER[0], DEFAULT_CENTER[1])} away`
                            : "Location updating..."
                        ) : "Offline"}
                      </div>
                    </div>
                  </div>
                  <div className="eta-box">
                    {bus.isLive ? (
                      <>
                        <div className="eta-num" style={{ color: crowdColors[bus.crowdLevel] }}>
                          {getETA(bus.location, DEFAULT_CENTER[0], DEFAULT_CENTER[1]) || "--"}
                        </div>
                        <div className="eta-label">arriving</div>
                      </>
                    ) : (
                      <div className="offline-tag">Offline</div>
                    )}
                  </div>
                </div>
                <div className="bc-bottom">
                  <span className="crowd-tag" style={{
                    background: crowdColors[bus.crowdLevel] + "22",
                    color: crowdColors[bus.crowdLevel]
                  }}>
                    {crowdEmoji[bus.crowdLevel]} {crowdLabels[bus.crowdLevel]}
                  </span>
                  <span className="driver-name">🧑‍✈️ {bus.driverName || "Unknown"}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {activeNav === "Routes" && (
          <div className="p-info-panel">
            <div className="p-panel-icon">🚌</div>
            <div className="p-panel-title">Available Routes</div>
            <div className="p-panel-desc">
              {buses.length === 0
                ? "No routes active at the moment."
                : buses.map(b => (
                  <div key={b.busId} className="p-route-row">
                    <span className="p-route-num" style={{ background: crowdColors[b.crowdLevel] }}>
                      #{b.routeNumber}
                    </span>
                    <span className="p-route-name">{b.routeName}</span>
                    <span className={`p-route-status ${b.isLive ? "live" : ""}`}>
                      {b.isLive ? "Live" : "Offline"}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {activeNav === "Alerts" && (
          <div className="p-info-panel">
            <div className="p-panel-icon">🔔</div>
            <div className="p-panel-title">Alerts</div>
            {buses.filter(b => b.crowdLevel === "full" && b.isLive).length > 0 ? (
              buses.filter(b => b.crowdLevel === "full" && b.isLive).map(b => (
                <div key={b.busId} className="p-alert red">
                  Bus #{b.routeNumber} is FULL — consider the next bus
                </div>
              ))
            ) : (
              <div className="p-alert green">All buses are running normally</div>
            )}
          </div>
        )}

        {activeNav === "Profile" && (
          <div className="p-info-panel">
            <div className="p-panel-icon">👤</div>
            <div className="p-panel-title">Passenger</div>
            <div className="p-panel-desc">
              You are viewing BusNow as a passenger.
              Real-time bus data is updated every 5 seconds.
            </div>
            <button className="p-panel-btn" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="p-bottom-nav">
        {NAVS.map(nav => (
          <div
            key={nav}
            className={`nav-item ${activeNav === nav ? "active" : ""}`}
            onClick={() => setActiveNav(nav)}
          >
            {nav === "Map"     && "🗺️"}
            {nav === "Routes"  && "🚌"}
            {nav === "Alerts"  && "🔔"}
            {nav === "Profile" && "👤"}
            <span>{nav}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}
