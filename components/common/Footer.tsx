export interface FooterProps {
  text?: string;
  className?: string;
}

export function Footer({ text, className = "" }: FooterProps) {
  const defaultText = "All rights reserved Happify Indonesia";

  return (
    <p
      className={`font-mono text-[10px] text-stone-400 text-center mt-8 ${className}`}
    >
      {text || defaultText}
    </p>
  );
}
