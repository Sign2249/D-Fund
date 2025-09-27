import React from "react";
import clsx from "clsx";

/**
 * 작은 라벨/태그 Badge 컴포넌트
 */
export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-200 text-gray-800",
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
