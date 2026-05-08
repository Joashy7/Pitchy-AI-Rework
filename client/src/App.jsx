import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/landingpage";
import NewPitch from "./pages/new-pitch";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/new-pitch" element={<NewPitch />} />
    </Routes>
  );
}

export default App;