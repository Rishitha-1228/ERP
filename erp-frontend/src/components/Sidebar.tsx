import { NavLink } from "react-router-dom";
import { ROLE_MENUS } from "../config/roleMenus";
import { Role } from "../types";

export function Sidebar({ role }: { role: Role }) {
  const menu = ROLE_MENUS[role];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">VertexERP</div>
        <div className="sidebar__brand-sub">OPERATIONS PORTAL</div>
      </div>
      <nav className="sidebar__nav">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => "sidebar__link" + (isActive ? " active" : "")}
          >
            <span className="sidebar__code">{item.code}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">v1.0.0 · VertexERP</div>
    </aside>
  );
}
