import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/landingpage";
import NewPitch from "./pages/new-pitch";
import Analysis from "./pages/analysis";
import Dashboard from "./pages/dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/new-pitch" element={<NewPitch />} />
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;