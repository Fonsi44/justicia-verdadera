export function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="url(#scale-bg)" opacity="0.15" />
      <defs>
        <radialGradient id="scale-bg" cx="50%" cy="50%">
          <stop stopColor="#c8a45c" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="scale-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#c8a45c" />
          <stop offset="100%" stopColor="#e2c88a" />
        </linearGradient>
      </defs>
      <line x1="100" y1="30" x2="100" y2="65" stroke="url(#scale-grad)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 120 L100 65 L150 120" stroke="url(#scale-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="60" y1="120" x2="140" y2="120" stroke="url(#scale-grad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="100" cy="65" r="5" fill="url(#scale-grad)" />
      <rect x="45" y="125" width="15" height="35" rx="3" fill="url(#scale-grad)" opacity="0.6" />
      <rect x="65" y="135" width="15" height="25" rx="3" fill="url(#scale-grad)" opacity="0.4" />
      <rect x="92" y="140" width="15" height="20" rx="3" fill="url(#scale-grad)" opacity="0.3" />
      <rect x="120" y="130" width="15" height="30" rx="3" fill="url(#scale-grad)" opacity="0.5" />
      <rect x="140" y="120" width="15" height="40" rx="3" fill="url(#scale-grad)" opacity="0.7" />
      <circle cx="60" cy="70" r="2" fill="url(#scale-grad)" opacity="0.3" />
      <circle cx="145" cy="85" r="2" fill="url(#scale-grad)" opacity="0.25" />
      <circle cx="45" cy="95" r="1.5" fill="url(#scale-grad)" opacity="0.2" />
    </svg>
  );
}

export function AIIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="url(#ai-bg)" opacity="0.15" />
      <defs>
        <radialGradient id="ai-bg" cx="50%" cy="50%">
          <stop stopColor="#7ea8c4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#7ea8c4" />
          <stop offset="100%" stopColor="#a8d4f0" />
        </linearGradient>
      </defs>
      <rect x="55" y="75" width="90" height="75" rx="10" stroke="url(#ai-grad)" strokeWidth="2.5" fill="none" />
      <rect x="65" y="85" width="70" height="14" rx="4" fill="url(#ai-grad)" opacity="0.2" />
      <rect x="65" y="105" width="50" height="14" rx="4" fill="url(#ai-grad)" opacity="0.15" />
      <rect x="65" y="125" width="60" height="14" rx="4" fill="url(#ai-grad)" opacity="0.1" />
      <circle cx="100" cy="50" r="20" stroke="url(#ai-grad)" strokeWidth="2.5" fill="none" />
      <circle cx="94" cy="46" r="3" fill="url(#ai-grad)" opacity="0.7" />
      <circle cx="106" cy="46" r="3" fill="url(#ai-grad)" opacity="0.7" />
      <path d="M92 56 Q100 62 108 56" stroke="url(#ai-grad)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="45" cy="60" r="1.5" fill="url(#ai-grad)" opacity="0.3" />
      <circle cx="155" cy="55" r="1.5" fill="url(#ai-grad)" opacity="0.3" />
      <circle cx="50" cy="140" r="1.5" fill="url(#ai-grad)" opacity="0.2" />
    </svg>
  );
}

export function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="url(#doc-bg)" opacity="0.15" />
      <defs>
        <radialGradient id="doc-bg" cx="50%" cy="50%">
          <stop stopColor="#b8956e" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="doc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#b8956e" />
          <stop offset="100%" stopColor="#d4b896" />
        </linearGradient>
      </defs>
      <path d="M60 40 L120 40 L150 70 L150 160 L60 160 Z" stroke="url(#doc-grad)" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <path d="M120 40 L120 70 L150 70" stroke="url(#doc-grad)" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <line x1="75" y1="90" x2="135" y2="90" stroke="url(#doc-grad)" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
      <line x1="75" y1="105" x2="125" y2="105" stroke="url(#doc-grad)" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
      <line x1="75" y1="120" x2="130" y2="120" stroke="url(#doc-grad)" strokeWidth="2" opacity="0.25" strokeLinecap="round" />
      <line x1="75" y1="135" x2="100" y2="135" stroke="url(#doc-grad)" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
      <circle cx="48" cy="135" r="1.5" fill="url(#doc-grad)" opacity="0.25" />
      <circle cx="160" cy="45" r="1.5" fill="url(#doc-grad)" opacity="0.25" />
    </svg>
  );
}

export function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="url(#cal-bg)" opacity="0.15" />
      <defs>
        <radialGradient id="cal-bg" cx="50%" cy="50%">
          <stop stopColor="#8b9d83" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="cal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#8b9d83" />
          <stop offset="100%" stopColor="#b5c9ad" />
        </linearGradient>
      </defs>
      <rect x="55" y="50" width="90" height="105" rx="8" stroke="url(#cal-grad)" strokeWidth="2.5" fill="none" />
      <line x1="55" y1="80" x2="145" y2="80" stroke="url(#cal-grad)" strokeWidth="2" />
      <circle cx="85" cy="65" r="3" fill="url(#cal-grad)" opacity="0.6" />
      <circle cx="115" cy="65" r="3" fill="url(#cal-grad)" opacity="0.6" />
      <circle cx="75" cy="98" r="4" fill="url(#cal-grad)" opacity="0.4" />
      <circle cx="95" cy="98" r="4" fill="url(#cal-grad)" opacity="0.5" />
      <circle cx="115" cy="98" r="4" fill="url(#cal-grad)" opacity="0.3" />
      <line x1="85" y1="115" x2="105" y2="115" stroke="url(#cal-grad)" strokeWidth="3" opacity="0.5" strokeLinecap="round" />
      <line x1="90" y1="130" x2="110" y2="130" stroke="url(#cal-grad)" strokeWidth="3" opacity="0.3" strokeLinecap="round" />
      <rect x="78" y="140" width="44" height="3" rx="1.5" fill="url(#cal-grad)" opacity="0.2" />
      <circle cx="155" cy="55" r="1.5" fill="url(#cal-grad)" opacity="0.2" />
    </svg>
  );
}

export function BillingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="url(#bill-bg)" opacity="0.15" />
      <defs>
        <radialGradient id="bill-bg" cx="50%" cy="50%">
          <stop stopColor="#c08060" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="bill-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#c08060" />
          <stop offset="100%" stopColor="#e8c4a8" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="90" r="40" stroke="url(#bill-grad)" strokeWidth="2.5" fill="none" />
      <circle cx="100" cy="90" r="25" stroke="url(#bill-grad)" strokeWidth="2" fill="none" opacity="0.5" />
      <line x1="100" y1="90" x2="118" y2="72" stroke="url(#bill-grad)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="97" y1="90" x2="97" y2="75" stroke="url(#bill-grad)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="140" cy="65" r="1.5" fill="url(#bill-grad)" opacity="0.3" />
      <circle cx="60" cy="120" r="1.5" fill="url(#bill-grad)" opacity="0.2" />
    </svg>
  );
}

export function SecurityIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="url(#sec-bg)" opacity="0.15" />
      <defs>
        <radialGradient id="sec-bg" cx="50%" cy="50%">
          <stop stopColor="#7ea8c4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="sec-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#7ea8c4" />
          <stop offset="100%" stopColor="#a8d4f0" />
        </linearGradient>
      </defs>
      <path d="M100 40 L140 55 L140 105 Q140 145 100 160 Q60 145 60 105 L60 55 Z" stroke="url(#sec-grad)" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <circle cx="100" cy="100" r="12" stroke="url(#sec-grad)" strokeWidth="2.5" fill="none" />
      <path d="M94 100 L98 105 L108 95" stroke="url(#sec-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="155" cy="50" r="1.5" fill="url(#sec-grad)" opacity="0.25" />
      <circle cx="45" cy="140" r="1.5" fill="url(#sec-grad)" opacity="0.2" />
    </svg>
  );
}
