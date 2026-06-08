import { Link } from "react-router-dom";
import { useState } from "react";

function Divider({ label }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex-1 h-px bg-outline-variant/20"></div>
      <span className="text-xs font-semibold text-on-surface-variant tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-outline-variant/20"></div>
    </div>
  );
}

function SocialSignInOptions({ providers }) {
  if (!providers.length) return null;

  return (
    <>
      <div className="flex gap-4 mb-8">
        {providers.map(({ label, icon }) => (
          <button
            key={label}
            type="button"
            className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-surface-container-highest hover:bg-surface-container-highest/80 rounded-full font-headline font-semibold text-on-surface transition-all active:scale-95"
            aria-label={`Sign in with ${label}`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <Divider label="OR CONTINUE WITH" />
    </>
  );
}

export default function AuthForm({
  title,
  subtitle,
  dividerLabel,
  submitLabel,
  submittingLabel,
  secondaryLabel,
  secondaryTo,
  error,
  isSubmitting,
  socialProviders = [],
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black font-headline text-on-surface mb-2">
          {title}
        </h1>
        <p className="text-on-surface-variant text-lg">{subtitle}</p>
      </div>

      <SocialSignInOptions providers={socialProviders} />
      {dividerLabel ? <Divider label={dividerLabel} /> : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2 tracking-wide">
            USERNAME
          </label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-on-surface tracking-wide">
              PASSWORD
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant/20 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? "visibility" : "visibility_off"}
              </span>
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-sm font-semibold text-red-400">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 mt-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full font-bold font-headline text-lg transition-all active:scale-95 shadow-lg shadow-blue-500/30 disabled:opacity-60"
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </form>

      <Link
        to={secondaryTo}
        className="block w-full py-3 mt-4 text-center bg-surface-container-highest hover:bg-surface-container-highest/80 text-on-surface rounded-full font-bold font-headline text-lg transition-all active:scale-95"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
}
