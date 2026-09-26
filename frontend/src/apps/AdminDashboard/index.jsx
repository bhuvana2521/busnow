import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useLiveBuses } from "../../hooks/useLiveBuses";
import "leaflet/dist/leaflet.css";
import "./AdminDashboard.css";
import L from "leaflet";
import axios from "axios";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl:       require("leaflet/dist/images/marker-icon.png"),
  shadowUrl:     require("leaflet/dist/images/marker-shadow.png"),
});

const API = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : "http://localhost:5000/api";

const crowdColors = {
  empty: "#1DB954",
  half:  "#FFB800",
  full:  "#FF3B30"
};

const crowdEmoji = {
  empty: "🟢",
  half:  "🟡",
  full:  "🔴"
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { buses, loading, refetch } = useLiveBuses({ fetchAll: true });
  const [activeTab, setActiveTab] = useState("overview");
  const [seeding, setSeeding]     = useState(false);
  const [seedMsg, setSeedMsg]     = useState("");

  const liveBuses  = buses.filter(b => b.isLive);
  const fullBuses  = buses.filter(b => b.crowdLevel === "full");
  const emptyBuses = buses.filter(b => b.crowdLevel === "empty");
  const halfBuses  = buses.filter(b => b.crowdLevel === "half");

  const seedDemo = async () => {
    setSeeding(true);
    setSeedMsg("");
    try {
      await axios.post(`${API}/buses/seed/demo`);
      setSeedMsg("Demo data loaded!");
      setTimeout(() => setSeedMsg(""), 3000);
      refetch();
    } catch {
      setSeedMsg("Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="admin-app">
      <header className="a-header">
        <div className="a-header-left">
          <button className="a-back" onClick={() => navigate("/")}>Back</button>
          <div className="a-logo">Bus<span>Now</span></div>
          <div className="a-role">Admin</div>
        </div>
        <div className="a-live-count">
          <div className="a-live-dot"></div>
          {liveBuses.length} Live
        </div>
      </header>

      {/* Stats */}
      <div className="a-stats">
        <div className="a-stat">
          <div className="a-stat-num">{buses.length}</div>
          <div className="a-stat-label">Total</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-num" style={{ color: "#1DB954" }}>{liveBuses.length}</div>
          <div className="a-stat-label">Live</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-num" style={{ color: "#FF3B30" }}>{fullBuses.length}</div>
          <div className="a-stat-label">Full</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-num" style={{ color: "#FFB800" }}>{halfBuses.length}</div>
          <div className="a-stat-label">Half</div>
        </div>
      </div>

      {/* Seed Banner */}
      {buses.length === 0 && !loading && (
        <div className="a-seed-banner">
          <div className="a-seed-text">No buses in the database yet.</div>
          <button className="a-seed-btn" onClick={seedDemo} disabled={seeding}>
            {seeding ? "Loading..." : "Load Demo Data"}
          </button>
        </div>
      )}
      {seedMsg && (
        <div className={`a-seed-msg ${seedMsg.includes("Failed") ? "error" : "success"}`}>
          {seedMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="a-tabs">
        {["overview", "map", "buses"].map(tab => (
          <button
            key={tab}
            className={`a-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "overview" && "📊 Overview"}
            {tab === "map"      && "🗺️ Map"}
            {tab === "buses"    && "🚌 Buses"}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="a-content">
          <div className="a-section-label">Fleet Status</div>
          <div className="a-fleet-cards">
            {[
              { label: "Empty Buses",  count: emptyBuses.length, color: "#1DB954", bg: "#E8F9EF", cls: "green", icon: "🟢" },
              { label: "Half Full",    count: halfBuses.length,  color: "#FFB800", bg: "#FFF8E6", cls: "yellow", icon: "🟡" },
              { label: "Full Buses",   count: fullBuses.length,  color: "#FF3B30", bg: "#FFF0EE", cls: "red",   icon: "🔴" }
            ].map(item => (
              <div key={item.label} className={`a-fleet-card ${item.cls}`}>
                <div className="afc-icon">{item.icon}</div>
                <div className="afc-info">
                  <div className="afc-num">{item.count}</div>
                  <div className="afc-label">{item.label}</div>
                </div>
                <div className="afc-bar" style={{ background: item.bg }}>
                  <div className="afc-fill" style={{
                    width: buses.length ? `${(item.count / buses.length) * 100}%` : "0%",
                    background: item.color
                  }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="a-section-label" style={{ marginTop: 20 }}>⚠️ Alerts</div>
          {fullBuses.length > 0 ? (
            <div className="a-alert red">
              🔴 {fullBuses.length} bus{fullBuses.length > 1 ? "es are" : " is"} full — consider deploying extras
            </div>
          ) : buses.length === 0 ? (
            <div className="a-alert yellow">
              ℹ️ No buses registered. Use "Load Demo Data" above.
            </div>
          ) : (
            <div className="a-alert green">✅ All buses running normally</div>
          )}

          {buses.length > 0 && (
            <div className="a-seed-refresh">
              <button className="a-refresh-btn" onClick={refetch}>↻ Refresh Data</button>
              <button className="a-seed-sm-btn" onClick={seedDemo} disabled={seeding}>
                {seeding ? "..." : "Reload Demo"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Map */}
      {activeTab === "map" && (
        <div className="a-map">
          <MapContainer
            center={[11.0168, 76.9558]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
            />
            {buses.map(bus =>
              bus.location?.lat ? (
                <Marker key={bus.busId} position={[bus.location.lat, bus.location.lng]}>
                  <Popup>
                    <strong>Bus #{bus.routeNumber}</strong><br />
                    {bus.routeName}<br />
                    Driver: {bus.driverName}<br />
                    {crowdEmoji[bus.crowdLevel]} {bus.crowdLevel}<br />
                    <span style={{ color: bus.isLive ? "#1DB954" : "#999" }}>
                      {bus.isLive ? "🟢 Live" : "⚫ Offline"}
                    </span>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>
      )}

      {/* All Buses */}
      {activeTab === "buses" && (
        <div className="a-content">
          <div className="a-section-label">
            All Buses
            <span className="a-buses-count">{buses.length} total</span>
          </div>

          {loading && <div className="a-loading">Loading buses...</div>}

          {!loading && buses.length === 0 && (
            <div className="a-empty">
              No buses registered yet.
              <button className="a-seed-btn" style={{ marginTop: 12, display: "block" }} onClick={seedDemo} disabled={seeding}>
                {seeding ? "Loading..." : "Load Demo Data"}
              </button>
            </div>
          )}

          {buses.map(bus => (
            <div key={bus.busId} className="a-bus-row">
              <div className="abr-left">
                <div className="abr-badge" style={{ background: crowdColors[bus.crowdLevel] }}>
                  {bus.routeNumber}
                </div>
                <div>
                  <div className="abr-name">{bus.routeName || `Route ${bus.routeNumber}`}</div>
                  <div className="abr-driver">🧑‍✈️ {bus.driverName || "Unknown"} · {bus.busId}</div>
                </div>
              </div>
              <div className="abr-right">
                <div className="abr-status" style={{
                  background: bus.isLive ? "#E8F9EF" : "#F4F4F2",
                  color:      bus.isLive ? "#1DB954" : "#8A8A8A"
                }}>
                  {bus.isLive ? "🟢 Live" : "⚫ Offline"}
                </div>
                <div className="abr-crowd" style={{ color: crowdColors[bus.crowdLevel] }}>
                  {crowdEmoji[bus.crowdLevel]} {bus.crowdLevel}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
