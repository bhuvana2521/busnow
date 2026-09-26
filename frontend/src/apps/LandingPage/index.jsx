import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const roles = [
  {
    path: "/passenger",
    icon: "🚌",
    title: "Passenger",
    desc: "Track live buses, see crowd levels & ETAs",
    color: "#FF5A00",
    bg: "#FFF3EE"
  },
  {
    path: "/driver",
    icon: "🧑‍✈️",
    title: "Driver",
    desc: "Go live and broadcast your location",
    color: "#1DB954",
    bg: "#E8F9EF"
  },
  {
    path: "/admin",
    icon: "📊",
    title: "Admin",
    desc: "Monitor the full fleet in real-time",
    color: "#4A90E2",
    bg: "#EAF2FF"
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-logo">Bus<span>Now</span></div>
        <div className="landing-tagline">Real-time bus tracking for everyone</div>
        <div className="landing-badge">
          <div className="landing-dot"></div>
          Live System
        </div>
      </div>

      <div className="landing-roles">
        <div className="landing-label">Choose your role</div>
        {roles.map(role => (
          <button
            key={role.path}
            className="role-card"
            style={{ "--accent": role.color, "--bg": role.bg }}
            onClick={() => navigate(role.path)}
          >
            <div className="role-icon" style={{ background: role.bg }}>{role.icon}</div>
            <div className="role-info">
              <div className="role-title">{role.title}</div>
              <div className="role-desc">{role.desc}</div>
            </div>
            <div className="role-arrow" style={{ color: role.color }}>→</div>
          </button>
        ))}
      </div>

      <div className="landing-footer">
        <div className="landing-features">
          <div className="lf-item">⚡ Real-time updates</div>
          <div className="lf-item">📍 GPS tracking</div>
          <div className="lf-item">👥 Crowd levels</div>
        </div>
        <div className="landing-copy">BusNow © 2024 — Portfolio Demo</div>
      </div>
    </div>
  );
}
