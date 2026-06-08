import { formatFighterLabel } from "@/lib/fighters/label";

export function FighterName({
  name,
  title,
  className = "",
}: {
  name: string;
  title?: string | null;
  className?: string;
}) {
  return (
    <span className={className}>{formatFighterLabel(name, title)}</span>
  );
}
