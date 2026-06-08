import { useNavigate } from "react-router-dom";
import { useState } from "react";

import AuthForm from "../components/auth/AuthForm";
import MarketingTopBar from "../components/layout/MarketingTopBar";
import { FAILED_LOGIN } from "../constants/messages";
import { login } from "../lib/api";
import { saveAuthUser } from "../utils/auth";

const LOGIN_PROVIDERS = [
  {
    label: "Google",
    icon: (
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-[#4285F4]"
      >
        G
      </span>
    ),
  },
  {
    label: "GitHub",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.93.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.28 9.28 0 0 1 12 7.04c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.17 10.17 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
      </svg>
    ),
  },
];

/**
 * Renders the login page and saves browser auth state after successful login.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {JSX.Element} Login page with marketing top bar, credential form, and placeholder social buttons.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async ({ username, password }) => {
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login({ username, password });
      saveAuthUser(result.user);
      navigate("/new-pitch");
    } catch (loginError) {
      setError(loginError.message || FAILED_LOGIN);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body">
      <MarketingTopBar />

      <main className="pt-20 min-h-screen flex items-center justify-center px-6 py-20">
        <AuthForm
          title="Welcome Back"
          subtitle="Access your AI coaching dashboard."
          submitLabel="Sign In"
          submittingLabel="Signing In..."
          secondaryLabel="Create Account"
          secondaryTo="/signup"
          error={error}
          isSubmitting={isSubmitting}
          socialProviders={LOGIN_PROVIDERS}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}
