import { Link } from 'react-router-dom';
import { SITE_NAME } from '@/lib/constants';

interface BrandMarkProps {
  inverted?: boolean;
  onClick?: () => void;
}

export function BrandMark({ inverted = false, onClick }: BrandMarkProps) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="group inline-flex items-center gap-2.5"
      aria-label={`${SITE_NAME} home`}
    >
      <span
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl font-display text-lg leading-none font-semibold transition-transform duration-300 group-hover:-rotate-3 ${
          inverted ? 'bg-cream text-brand-900' : 'bg-brand-900 text-cream'
        }`}
      >
        b
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent-400" />
      </span>
      <span
        className={`font-display text-[22px] leading-none font-semibold tracking-tight ${
          inverted ? 'text-cream' : 'text-ink-900'
        }`}
      >
        {SITE_NAME.toLowerCase()}
        <span className="text-accent-500">.</span>
      </span>
    </Link>
  );
}
