import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/upload", label: "Upload Simulation" },
  { to: "/dashboard", label: "Dashboard" },
];

const dashboardSections = [
  { id: "finance-inventory", label: "Finance & Inventory" },
  { id: "bottleneck-analysis", label: "Bottleneck Analysis" },
];

export default function Navbar() {
  const location = useLocation();
  const isDashboardPage = location.pathname === "/dashboard";

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for sticky navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

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

          {isDashboardPage && (
            <>
              <span className="nav-divider">|</span>
              {dashboardSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="nav-link nav-link-section"
                >
                  {section.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
