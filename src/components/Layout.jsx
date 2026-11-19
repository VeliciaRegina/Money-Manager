import { NavLink, Outlet } from "react-router-dom";

import { LayoutDashboard, History, Target, Wallet } from "lucide-react";

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <Wallet size={20} />
          </span>

          <span>
            Fin<span className="brand-accent">Track</span>
            <small>PERSONAL FINANCE</small>
          </span>
        </div>

        <div className="side-label">MENU</div>

        <nav>
          <NavLink to="/" end>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink to="/history">
            <History size={18} />
            History Bulanan
          </NavLink>

          <NavLink to="/goals">
            <Target size={18} />
            Budget & Goals
          </NavLink>
        </nav>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">YOUR LITTLE FINANCE SPACE</span>

            <h2>Yuk, atur uangmu!</h2>
          </div>

          <div className="top-date">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>

      <nav className="mobile-nav">
        <NavLink to="/" end>
          <LayoutDashboard />
          <span>Home</span>
        </NavLink>

        <NavLink to="/history">
          <History />
          <span>History</span>
        </NavLink>

        <NavLink to="/goals">
          <Target />
          <span>Goals</span>
        </NavLink>
      </nav>
    </div>
  );
}
