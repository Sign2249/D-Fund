import React from "react";

/**
 * Card 컴포넌트 (박스 컨테이너)
 */
export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-white border border-gray-200 shadow-sm rounded-lg p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
