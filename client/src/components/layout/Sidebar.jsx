import { Link, useNavigate } from "react-router-dom";

import { getAuthenticatedUser, logoutUser } from "../../utils/auth";

const NAV_LINKS = [
  { href: "/landing", icon: "home", label: "Home", page: "landing" },
  { href: "/dashboard", icon: "dashboard", label: "Dashboard", page: "dashboard" },
  { href: "/analysis", icon: "psychology", label: "AI Feedback", page: "analysis" },
];

/**
 * Renders the app sidebar navigation and logout action.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {string} props.activePage - Current active page key.
 *
 * Returns:
 * @returns {JSX.Element} Sidebar with navigation, upgrade card, and optional logout button.
 */
function Sidebar({ activePage }) {
  const navigate = useNavigate();
  const currentUser = getAuthenticatedUser();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__content">
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <span className="material-symbols-outlined sidebar__logo-icon">
              rocket_launch
            </span>
          </div>

          <div>
            <p className="sidebar__app-name">Pitchy-AI</p>
            <p className="sidebar__app-tagline">Your Pitch. Perfected.</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.page}
              to={link.href}
              className={`sidebar__nav-link ${activePage === link.page ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="sidebar__footer">
        <div className="upgrade-card">
          <p className="upgrade-card__label">Upgrade AI Coach</p>
          <p className="upgrade-card__body">Unlock advanced voice scoring and persona tuning</p>
          <button type="button" className="upgrade-card__btn">
            Upgrade
          </button>
        </div>

        {currentUser ? (
          <nav className="sidebar__footer-nav">
            <button
              type="button"
              onClick={handleLogout}
              className="sidebar__footer-link sidebar__footer-button"
            >
              <span className="material-symbols-outlined">logout</span>
              Logout
            </button>
          </nav>
        ) : null}
      </div>
    </aside>
  );
}

export default Sidebar;
