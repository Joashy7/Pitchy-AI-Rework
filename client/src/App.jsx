import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import LandingPage from "./pages/landingpage";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import NewPitch from "./pages/new-pitch";
import Analysis from "./pages/analysis";
import Dashboard from "./pages/dashboard";
import {
  AUTH_CHECK_INTERVAL_MS,
  getAuthenticatedUser,
  hasStoredAuthUser,
} from "./utils/auth";

const PUBLIC_PATHS = new Set(["/", "/landing", "/login", "/signup"]);

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthExpiration = () => {
      const hadAuthState = hasStoredAuthUser();
      const activeUser = getAuthenticatedUser();

      if (hadAuthState && !activeUser && !PUBLIC_PATHS.has(location.pathname)) {
        navigate("/login");
      }
    };

    checkAuthExpiration();
    const intervalId = setInterval(checkAuthExpiration, AUTH_CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!location.hash) return;

    requestAnimationFrame(() => {
      document.querySelector(location.hash)?.scrollIntoView();
    });
  }, [location.hash, location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/new-pitch" element={<NewPitch />} />
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
