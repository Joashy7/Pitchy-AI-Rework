const NAV_LINKS = [
  { href: "/landing", icon: "home", label: "Home", page: "landing" },
  { href: "/dashboard", icon: "dashboard", label: "Dashboard", page: "dashboard" },
  { href: "/analysis", icon: "psychology", label: "AI Feedback", page: "analysis" },
  { href: "#", icon: "settings_suggest", label: "Settings", page: "settings" },
];

function Sidebar({ activePage }) {
  return (
    <aside className="sidebar">
      <div style={{ padding: "var(--space-8)" }}>
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
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
            <a
              key={link.page}
              href={link.href}
              className={`sidebar__nav-link ${activePage === link.page ? "active" : ""}`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="sidebar__footer">
        <div className="upgrade-card">
          <p className="upgrade-card__label">Upgrade to Pro</p>
          <p className="upgrade-card__body">Unlock advanced neural analysis</p>
          <button className="upgrade-card__btn">Get Started</button>
        </div>

        <nav className="sidebar__footer-nav">
          <a href="#" className="sidebar__footer-link">
            <span className="material-symbols-outlined">help</span>
            Help Center
          </a>

          <a href="#" className="sidebar__footer-link">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </a>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
