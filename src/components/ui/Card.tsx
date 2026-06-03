import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`card-arena ${glow ? "shadow-neon border-arena-neon/30" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
