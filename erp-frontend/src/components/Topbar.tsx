import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../config/roleMenus";
import { useLocation } from "react-router-dom";
import { ROLE_MENUS } from "../config/roleMenus";

export function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const currentItem = ROLE_MENUS[user.role].find((m) => location.pathname.startsWith(m.path));

  return (
    <header className="topbar">
      <div className="topbar__title">{currentItem?.label || "Dashboard"}</div>
      <div className="topbar__right">
        <div className="manifest-tag">
          <span className="manifest-tag__label">{ROLE_LABELS[user.role]}</span>
          <span className="manifest-tag__name">{user.name}</span>
        </div>
        <button className="btn-logout" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
