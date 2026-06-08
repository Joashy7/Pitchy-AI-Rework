import { Link } from "react-router-dom";

import { getAuthenticatedUser } from "../../utils/auth";

/**
 * Renders the marketing top navigation used on public pages.
 *
 * Args:
 * None.
 *
 * Returns:
 * @returns {JSX.Element} Fixed marketing navigation bar with feature links and start action.
 */
function MarketingTopBar() {
  const activeUser = getAuthenticatedUser();
  const startPitchingPath = activeUser ? "/new-pitch" : "/login";

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl shadow-2xl shadow-blue-900/20">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 py-4 w-full">
        <div className="text-2xl font-bold tracking-tighter text-slate-50 font-headline">
          Pitchy-AI
        </div>

        <div className="hidden md:flex gap-8 items-center">
          <Link to="/landing#features" className="nav-link-active font-headline text-sm font-semibold tracking-wide transition-all duration-300">
            Features
          </Link>
          <Link to="/landing#how-it-works" className="font-headline text-sm font-semibold tracking-wide text-slate-400 hover:text-slate-100 transition-all duration-300">
            How it Works
          </Link>
          <Link to="/dashboard" className="font-headline text-sm font-semibold tracking-wide text-slate-400 hover:text-slate-100 transition-all duration-300">
            Dashboard
          </Link>
        </div>

        <div className="hidden md:flex gap-4 items-center">
          <Link
            to={startPitchingPath}
            className="btn-primary-br text-on-primary-container px-6 py-2.5 rounded-xl font-headline text-sm font-bold tracking-wide hover:opacity-80 transition-all duration-300 active:scale-95"
          >
            Start Pitching
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default MarketingTopBar;
