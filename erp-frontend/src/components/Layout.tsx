import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="app-shell">
      <Sidebar role={user.role} />
      <div className="main-area">
        <Topbar />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
