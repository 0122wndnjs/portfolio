import Link from "next/link";
import type { ReactNode } from "react";

export type ViewOption = { value: string; label: string; href: string; icon?: ReactNode };

export default function ViewSwitch({ label, options, current }: { label: string; options: ViewOption[]; current: string }) {
  return (
    <nav className="rd-seg" aria-label={label}>
      {options.map((option) => (
        <Link key={option.value} href={option.href} aria-current={option.value === current ? "page" : undefined}>
          {option.icon}
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
