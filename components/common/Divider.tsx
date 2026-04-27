interface DividerProps {
  className?: string;
  variant?: "light" | "dark";
}

const variantClasses = {
  light: "border-stone-200",
  dark: "border-stone-300",
};

export function Divider({ className = "", variant = "light" }: DividerProps) {
  return <div className={`border-t ${variantClasses[variant]} ${className}`} />;
}
