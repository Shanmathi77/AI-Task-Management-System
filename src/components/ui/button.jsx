// frontend/src/components/ui/button.jsx
import React from "react";

export function Button({ children, className = "", variant, ...rest }) {
  const base = "inline-flex items-center justify-center px-3 py-2 rounded-lg font-semibold";
  const style =
    variant === "secondary"
      ? "bg-gray-200 text-black"
      : "bg-gradient-to-r from-orange-400 to-yellow-300 text-black";
  return (
    <button className={`${base} ${style} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export default Button;
