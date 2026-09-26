import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./apps/LandingPage";
import PassengerApp from "./apps/PassengerApp";
import DriverApp from "./apps/DriverApp";
import AdminDashboard from "./apps/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/passenger" element={<PassengerApp />} />
        <Route path="/driver"   element={<DriverApp />} />
        <Route path="/admin"    element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
