import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "../../hooks/useGeolocation";
import socket from "../../socket";
import "./DriverApp.css";

const ROUTES = [
  { number: "10A", name: "City Centre to Airport" },
  { number: "22B", name: "North Park to Central Station" },
  { number: "35C", name: "West End to Tech Park" },
  { number: "47D", name: "University to Downtown" },
  { number: "55E", name: "Market Square to Suburbs" },
];

const CROWD_OPTIONS = [
  { value: "empty", emoji: "", label: "Empty" },
  { value: "half",  emoji: "", label: "Half Full" },
  { value: "full",  emoji: "", label: "Full" },
];

function LoginScreen({ onLogin }) {
  const [driverName, setDriverName]   = useState("");
  const [busId, setBusId]             = useState("");
  const [routeNumber, setRouteNumber] = useState("");
  const [error, setError]             = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!driverName.trim() || !busId.trim() || !routeNumber) { setError("Please fill in all fields."); return; }
    const route = ROUTES.find(r => r.number === routeNumber);
    onLogin({ driverName: driverName.trim(), busId: busId.trim().toUpperCase(), routeNumber, routeName: route ? route.name : "Route " + routeNumber });
  };
  return (
    <div className="d-login">
      <div className="d-login-icon"></div>
      <div className="d-login-title">Driver Sign In</div>
      <div className="d-login-sub">Enter your details to start your shift</div>
      <form className="d-login-form" onSubmit={handleSubmit}>
        <div className="d-field"><label className="d-field-label">Your Name</label><input className="d-input" type="text" placeholder="e.g. John Smith" value={driverName} onChange={e => setDriverName(e.target.value)} /></div>
        <div className="d-field"><label className="d-field-label">Bus ID</label><input className="d-input" type="text" placeholder="e.g. BUS-001" value={busId} onChange={e => setBusId(e.target.value)} /></div>
        <div className="d-field"><label className="d-field-label">Route</label><select className="d-input d-select" value={routeNumber} onChange={e => setRouteNumber(e.target.value)}><option value="">Select a route...</option>{ROUTES.map(r => (<option key={r.number} value={r.number}>{r.number} - {r.name}</option>))}</select></div>
        {error && <div className="d-login-error">{error}</div>}
        <button type="submit" className="d-go-live">Continue</button>
      </form>
    </div>
  );
}

export default function DriverApp() {
  const navigate = useNavigate();
  const { location, error: gpsError, loading: gpsLoading } = useGeolocation();
  const [driver, setDriver]         = useState(null);
  const [isLive, setIsLive]         = useState(false);
  const [crowdLevel, setCrowdLevel] = useState("empty");
  const [connected, setConnected]   = useState(socket.connected);
  const intervalRef = useRef(null);
  useEffect(() => {
    const on = () => setConnected(true); const off = () => setConnected(false);
    socket.on("connect", on); socket.on("disconnect", off);
    return () => { socket.off("connect", on); socket.off("disconnect", off); };
  }, []);
  const broadcastLocation = useCallback(() => {
    if (!driver || !location) return;
    socket.emit("driver:location", { busId: driver.busId, routeNumber: driver.routeNumber, routeName: driver.routeName, driverName: driver.driverName, location: { lat: location.lat, lng: location.lng }, crowdLevel });
  }, [driver, location, crowdLevel]);
  useEffect(() => {
    if (isLive) { broadcastLocation(); intervalRef.current = setInterval(broadcastLocation, 5000); }
    else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [isLive, broadcastLocation]);
  useEffect(() => { if (isLive && driver) socket.emit("driver:crowd", { busId: driver.busId, crowdLevel }); }, [crowdLevel, isLive, driver]);
  const goLive = () => { if (location) setIsLive(true); };
  const goOffline = () => { setIsLive(false); if (driver) socket.emit("driver:offline", { busId: driver.busId }); };
  const handleLogout = () => { goOffline(); setDriver(null); };
  if (!driver) {
    return (
      <div className="driver-app">
        <header className="d-header">
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button className="d-back" onClick={() => navigate("/")}>Back</button>
            <div className="d-logo"><span>Bus</span>Now</div>
            <div className="d-role">Driver</div>
          </div>
        </header>
        <LoginScreen onLogin={setDriver} />
      </div>
    );
  }
  const colorMap = { empty: "#1DB954", half: "#FFB800", full: "#FF3B30" };
  const bgMap    = { empty: "#E8F9EF", half: "#FFF8E6", full: "#FFF0EE" };
  return (
    <div className="driver-app">
      <header className="d-header">
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button className="d-back" onClick={handleLogout}>Back</button>
          <div className="d-logo"><span>Bus</span>Now</div>
          <div className="d-role">Driver</div>
        </div>
        <div className={"d-status-badge " + (isLive ? "live" : "offline")}><div className="d-status-dot"></div>{isLive ? "LIVE" : "OFFLINE"}</div>
      </header>
      {!connected && <div className="d-conn-warn">No connection - reconnecting...</div>}
      {isLive && <div className="d-live-bar"><div className="d-live-pulse"></div>Broadcasting live location every 5s</div>}
      <div className="d-driver-banner">Driver: <strong>{driver.driverName}</strong>  Bus <strong>{driver.busId}</strong></div>
      <div className="d-bus-info">
        <div className="d-info-card"><div className="d-info-label">Route</div><div className="d-info-value">{driver.routeNumber}</div></div>
        <div className="d-info-card" style={{ flex:2 }}><div className="d-info-label">Route Name</div><div className="d-info-value" style={{ fontSize:".85rem" }}>{driver.routeName}</div></div>
      </div>
      <div className="d-gps-card">
        <div className="d-gps-icon"></div>
        <div className="d-gps-info">
          <div className="d-gps-title">GPS Location</div>
          {gpsLoading && <div className="d-gps-loading">Acquiring signal...</div>}
          {gpsError   && <div className="d-gps-error">{gpsError}</div>}
          {location   && <div className="d-gps-coords">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}{location.accuracy && <span className="d-gps-acc"> +/- {Math.round(location.accuracy)}m</span>}</div>}
        </div>
        <div className={"d-gps-dot" + (location ? " active" : "")}></div>
      </div>
      <div className="d-section-label" style={{ marginTop:8 }}>Crowd Level</div>
      <div className="d-crowd-btns">
        {CROWD_OPTIONS.map(opt => {
          const active = crowdLevel === opt.value;
          return (
            <button key={opt.value} className={"d-crowd-btn" + (active ? " active" : "")} style={active ? { borderColor: colorMap[opt.value], background: bgMap[opt.value] } : {}} onClick={() => setCrowdLevel(opt.value)}>
              <span className="d-crowd-emoji">{opt.emoji}</span>
              <span className="d-crowd-label" style={{ color: active ? colorMap[opt.value] : "#0D0D0D" }}>{opt.label}</span>
            </button>
          );
        })}
      </div>
      <div className="d-action">
        {!isLive ? (
          <>
            <button className="d-go-live" disabled={!location || !!gpsError} onClick={goLive}>Go Live</button>
            {!location && !gpsError && <div className="d-gps-warn">Waiting for GPS signal...</div>}
            {gpsError  && <div className="d-gps-warn">GPS unavailable - enable location access</div>}
          </>
        ) : (
          <button className="d-go-offline" onClick={goOffline}>End Shift</button>
        )}
      </div>
    </div>
  );
}
