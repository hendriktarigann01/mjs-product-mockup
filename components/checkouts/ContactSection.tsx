import Link from "next/link";
import { INPUT_CLASS } from "@/constants/ui";

interface ContactSectionProps {
  email: string;
  onEmailChange: (value: string) => void;
  newsletter: boolean;
  onNewsletterChange: (value: boolean) => void;
}

export function ContactSection({
  email,
  onEmailChange,
  newsletter,
  onNewsletterChange,
}: ContactSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="font-serif text-xl text-stone-800 mb-4">Contact</h2>
      <div className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className={INPUT_CLASS}
        />
        {/* <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={newsletter}
            onChange={(e) => onNewsletterChange(e.target.checked)}
            className="accent-stone-600"
          />
          <span className="font-mono text-xs text-stone-500">
            Email me with news and offers
          </span>
        </label> */}
      </div>
    </section>
  );
}
