import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  glow = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`card-arena ${glow ? "shadow-neon border-arena-neon/30" : ""} ${className}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
