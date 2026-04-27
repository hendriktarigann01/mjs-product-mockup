interface CardProps {
  children: React.ReactNode;
  className?: string;
  border?: boolean;
  background?: "light" | "white" | "none";
}

const backgroundClasses = {
  light: "bg-white/70",
  white: "bg-white",
  none: "",
};

export function Card({
  children,
  className = "",
  border = true,
  background = "light",
}: CardProps) {
  const borderClass = border ? "border border-stone-200" : "";
  const bgClass = backgroundClasses[background];

  return (
    <div className={`${borderClass} ${bgClass} ${className}`}>{children}</div>
  );
}
