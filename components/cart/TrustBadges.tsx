import { TRUST_BADGES } from "@/constants/cart";

interface TrustBadgesProps {
  show?: boolean;
}

export function TrustBadges({ show = true }: TrustBadgesProps) {
  if (!show) return null;

  return (
    <div className="mt-16 pt-8 border-t border-stone-200 grid grid-cols-2 md:grid-cols-3 gap-6">
      {TRUST_BADGES.map((badge) => (
        <div key={badge.title}>
          <p className="font-serif text-2xl text-center text-stone-800 leading-tight">
            {badge.title}
          </p>
          <p className="font-mono text-xl text-center text-stone-400">{badge.sub}</p>
        </div>
      ))}
    </div>
  );
}
