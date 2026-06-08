"use client";

export function isAvatarImage(icon?: string): boolean {
  return Boolean(icon?.startsWith("data:image/"));
}

export function FighterAvatar({
  icon,
  name,
  size = "md",
  className = "",
}: {
  icon?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim =
    size === "lg" ? "w-16 h-16" : size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const text =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";

  if (icon && isAvatarImage(icon)) {
    return (
      <img
        src={icon}
        alt={`${name} 頭像`}
        className={`${dim} rounded-full object-cover shrink-0 border border-arena-border ${className}`}
      />
    );
  }

  return (
    <span
      className={`${dim} ${text} flex items-center justify-center shrink-0 rounded-full bg-arena-card border border-arena-border ${className}`}
      aria-hidden
    >
      {icon || name.charAt(0) || "🎮"}
    </span>
  );
}
