import { useNavigate } from "react-router-dom";
import { useState } from "react";

import AuthForm from "../components/auth/AuthForm";
import MarketingTopBar from "../components/layout/MarketingTopBar";
import { FAILED_ACCOUNT_CREATE } from "../constants/messages";
import { signup } from "../lib/api";
import { saveAuthUser } from "../utils/auth";

/**
 * Renders the signup page and saves browser auth state after account creation.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {JSX.Element} Signup page with marketing top bar and account creation form.
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async ({ username, password }) => {
    setError("");
    setIsSubmitting(true);

    try {
      const result = await signup({ username, password });
      saveAuthUser(result.user);
      navigate("/new-pitch");
    } catch (signupError) {
      setError(signupError.message || FAILED_ACCOUNT_CREATE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body">
      <MarketingTopBar />

      <main className="pt-20 min-h-screen flex items-center justify-center px-6 py-20">
        <AuthForm
          title="Create Account"
          subtitle="Save your pitches and track your coaching history."
          submitLabel="Sign Up"
          submittingLabel="Creating Account..."
          secondaryLabel="Back to Login"
          secondaryTo="/login"
          error={error}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}
