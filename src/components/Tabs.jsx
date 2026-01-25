import React from "react";

export default function Tabs({ items, activeKey, onChange }) {
  return (
    <div className="tabs" role="tablist" aria-label="Scenario tabs">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={activeKey === item.key}
          className={activeKey === item.key ? "tab active" : "tab"}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
