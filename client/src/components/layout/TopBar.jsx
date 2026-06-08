import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getAuthenticatedUser, logoutUser } from "../../utils/auth";

const PROFILE_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCEEkbMJ1oKR7lOHtujcFiuIzNc3K1uVHXipnX4-Rmtd2IXcQ0PrXPdhTjvL6zX0QvoJ64XX_0TiH-xL8XmiuCr5wooUWjk31OoG6C2n714SEQs-JR_F53Q2jZGPNlp7LISbArZLZZ5qGMTsFhaE1NX7EeScxjResy2KGnHpbMMSwgKZwH7gnWqSe0ZSlIDj3kLAvPajb2VZJie9zp8y5ud-GXDXFbyt_2rz7oPywnrlvbBvh8OeDHDuIB0k1ClJnbAWqBBi1TjVmo";

function TopBar({ searchValue, onSearchChange }) {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const currentUser = getAuthenticatedUser();
  const searchProps =
    searchValue === undefined
      ? {}
      : {
          value: searchValue,
          onChange: onSearchChange,
        };

  const handleLogout = () => {
    logoutUser();
    setIsProfileMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="bg-[#121416]/60 backdrop-blur-xl border-b border-[#414754]/15 h-16 sticky top-0 z-40 flex justify-between items-center px-8 max-w-[1920px] mx-auto">
      <div className="flex items-center gap-8">
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            search
          </span>

          <input
            className="bg-surface-container-lowest border-none rounded-full py-1.5 pl-10 pr-4 text-xs text-on-surface focus:ring-1 focus:ring-primary w-64 placeholder:text-slate-600"
            placeholder="Search pitches..."
            type="text"
            {...searchProps}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/new-pitch"
          className="pitch-gradient text-on-primary-fixed font-headline font-bold text-sm px-6 py-2 rounded-full active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          New Pitch
        </Link>

        <div className="flex items-center gap-2 border-l border-outline-variant/30 pl-4">
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 active:scale-95 transition-all"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                aria-label="Open profile menu"
              >
                <img
                  alt="User profile"
                  className="w-full h-full object-cover"
                  src={PROFILE_IMAGE_URL}
                />
              </button>

              {isProfileMenuOpen ? (
                <div
                  className="absolute right-0 top-11 w-44 rounded-lg border border-outline-variant/20 bg-surface-container-highest shadow-2xl shadow-black/30 overflow-hidden py-2 z-50"
                  role="menu"
                >
                  <div className="px-4 py-2 border-b border-outline-variant/20">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Signed in as
                    </p>
                    <p className="text-sm font-semibold text-on-surface truncate">
                      {currentUser.username}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm font-semibold text-on-surface hover:bg-white/5 transition-colors"
                    role="menuitem"
                  >
                    Profile
                  </button>

                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm font-semibold text-on-surface hover:bg-white/5 transition-colors"
                    role="menuitem"
                  >
                    Settings
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm font-semibold text-red-300 hover:bg-red-500/10 transition-colors"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-full bg-surface-container-highest text-on-surface text-sm font-bold font-headline hover:bg-surface-bright active:scale-95 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
