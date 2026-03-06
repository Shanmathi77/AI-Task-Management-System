// frontend/src/components/ui/card.jsx
import React from "react";

export function Card({ children, className = "" }) {
  return <div className={`glass-card ${className}`.trim()}>{children}</div>;
}

export function CardHeader({ children, className = "" }) {
  return <div className={`card-header ${className}`.trim()}>{children}</div>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`card-content ${className}`.trim()}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h3 className={`card-title ${className}`.trim()}>{children}</h3>;
}

export default Card;
