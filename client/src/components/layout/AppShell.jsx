import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

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
