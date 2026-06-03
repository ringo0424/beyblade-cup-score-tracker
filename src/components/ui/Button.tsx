import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-arena-neon/80 to-arena-purple/80 text-arena-black font-bold hover:opacity-90",
  secondary:
    "bg-arena-card border border-arena-border text-gray-200 hover:border-arena-neon/40",
  danger: "bg-red-950/80 border border-red-500/40 text-red-300",
  ghost: "bg-transparent text-gray-400 hover:text-gray-200",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl px-4 py-3 text-center transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
