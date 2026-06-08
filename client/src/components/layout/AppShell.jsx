import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/**
 * Provides the authenticated app layout with sidebar and top bar.
 *
 * Args:
 * @param {object} props - Component props.
 * @param {string} props.activePage - Current page key used by the sidebar.
 * @param {string} [props.searchValue] - Current dashboard search value.
 * @param {Function} [props.onSearchChange] - Search input change handler.
 * @param {React.ReactNode} props.children - Page content rendered inside the shell.
 *
 * Returns:
 * @returns {JSX.Element} App shell layout with sidebar, top bar, and page content.
 */
function AppShell({ activePage, searchValue, onSearchChange, children }) {
  return (
    <div className="dark">
      <Sidebar activePage={activePage} />

      <main className="main-canvas">
        <TopBar searchValue={searchValue} onSearchChange={onSearchChange} />
        {children}
      </main>
    </div>
  );
}

export default AppShell;
