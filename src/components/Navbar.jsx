import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/upload", label: "Upload Simulation" },
  { to: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">Medica Simulation Analyzer</div>
        <div className="navbar-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
