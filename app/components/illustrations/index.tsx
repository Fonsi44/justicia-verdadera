export function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="100" cy="100" r="90" fill="url(#scale-bg)" opacity="0.1" />
      <defs>
        <radialGradient id="scale-bg" cx="50%" cy="50%">
          <stop stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="scale-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#2a4f7a" />
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
      <circle cx="100" cy="100" r="90" fill="url(#ai-bg)" opacity="0.1" />
      <defs>
        <radialGradient id="ai-bg" cx="50%" cy="50%">
          <stop stopColor="#0d9488" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#0d9488" />
          <stop offset="100%" stopColor="#14b8a6" />
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
      <circle cx="100" cy="100" r="90" fill="url(#doc-bg)" opacity="0.12" />
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
      <circle cx="100" cy="100" r="90" fill="url(#cal-bg)" opacity="0.1" />
      <defs>
        <radialGradient id="cal-bg" cx="50%" cy="50%">
          <stop stopColor="#7ea8c4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="cal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#7ea8c4" />
          <stop offset="100%" stopColor="#a8cfe0" />
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
      <circle cx="100" cy="100" r="90" fill="url(#bill-bg)" opacity="0.12" />
      <defs>
        <radialGradient id="bill-bg" cx="50%" cy="50%">
          <stop stopColor="#8b9d83" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="bill-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#8b9d83" />
          <stop offset="100%" stopColor="#a8b8a0" />
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
      <circle cx="100" cy="100" r="90" fill="url(#sec-bg)" opacity="0.1" />
      <defs>
        <radialGradient id="sec-bg" cx="50%" cy="50%">
          <stop stopColor="#c08060" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="sec-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#c08060" />
          <stop offset="100%" stopColor="#d4a080" />
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

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="50%">
          <stop stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="hero-building" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#2a4f7a" />
        </linearGradient>
        <linearGradient id="hero-accent" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#0d9488" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>

      <circle cx="300" cy="200" r="200" fill="url(#hero-glow)" opacity="0.05" />

      <circle cx="80" cy="60" r="3" fill="currentColor" opacity="0.3" />
      <circle cx="520" cy="350" r="4" fill="currentColor" opacity="0.15" />
      <circle cx="560" cy="80" r="2.5" fill="currentColor" opacity="0.2" />
      <circle cx="40" cy="350" r="2" fill="#7ea8c4" opacity="0.25" />
      <circle cx="480" cy="120" r="2" fill="currentColor" opacity="0.15" />

      <rect x="260" y="280" width="60" height="1.5" rx="0.75" fill="currentColor" opacity="0.15" />
      <rect x="420" y="140" width="40" height="1.5" rx="0.75" fill="currentColor" opacity="0.12" />

      <rect x="60" y="345" width="130" height="12" rx="2" fill="url(#hero-building)" opacity="0.85" />
      <rect x="70" y="333" width="110" height="12" rx="2" fill="url(#hero-building)" opacity="0.65" />

      <rect x="75" y="170" width="8" height="163" rx="1" fill="url(#hero-building)" opacity="0.45" />
      <rect x="109" y="170" width="8" height="163" rx="1" fill="url(#hero-building)" opacity="0.45" />
      <rect x="143" y="170" width="8" height="163" rx="1" fill="url(#hero-building)" opacity="0.45" />
      <rect x="177" y="170" width="8" height="163" rx="1" fill="url(#hero-building)" opacity="0.45" />

      <rect x="71" y="163" width="16" height="7" rx="1.5" fill="url(#hero-building)" opacity="0.6" />
      <rect x="105" y="163" width="16" height="7" rx="1.5" fill="url(#hero-building)" opacity="0.6" />
      <rect x="139" y="163" width="16" height="7" rx="1.5" fill="url(#hero-building)" opacity="0.6" />
      <rect x="173" y="163" width="16" height="7" rx="1.5" fill="url(#hero-building)" opacity="0.6" />

      <rect x="71" y="326" width="16" height="5" rx="1.5" fill="url(#hero-building)" opacity="0.5" />
      <rect x="105" y="326" width="16" height="5" rx="1.5" fill="url(#hero-building)" opacity="0.5" />
      <rect x="139" y="326" width="16" height="5" rx="1.5" fill="url(#hero-building)" opacity="0.5" />
      <rect x="173" y="326" width="16" height="5" rx="1.5" fill="url(#hero-building)" opacity="0.5" />

      <path d="M45 170 L215 170 L130 125 Z" stroke="url(#hero-building)" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <circle cx="130" cy="153" r="7" stroke="url(#hero-building)" strokeWidth="1.5" fill="none" opacity="0.7" />

      <rect x="122" y="270" width="16" height="63" rx="8" fill="url(#hero-building)" opacity="0.35" />

      <line x1="310" y1="85" x2="310" y2="190" stroke="url(#hero-accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="310" cy="85" r="6" stroke="url(#hero-accent)" strokeWidth="2" fill="none" />
      <circle cx="310" cy="125" r="4" fill="url(#hero-accent)" opacity="0.6" />
      <path d="M260 125 L310 85 L360 125" stroke="url(#hero-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="270" y1="125" x2="350" y2="125" stroke="url(#hero-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="270" y1="125" x2="270" y2="175" stroke="url(#hero-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="350" y1="125" x2="350" y2="175" stroke="url(#hero-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M255 175 Q270 190 285 175 Z" fill="url(#hero-accent)" opacity="0.15" stroke="url(#hero-accent)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M335 175 Q350 190 365 175 Z" fill="url(#hero-accent)" opacity="0.15" stroke="url(#hero-accent)" strokeWidth="1.5" strokeLinejoin="round" />

      <rect x="428" y="195" width="82" height="105" rx="4" stroke="#b8956e" strokeWidth="2" fill="none" opacity="0.35" />
      <rect x="442" y="205" width="82" height="105" rx="4" stroke="#b8956e" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M456 215 L530 215 L530 320 L456 320 Z" stroke="#b8956e" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M530 215 L530 235 L510 235 Z" fill="#b8956e" opacity="0.15" stroke="#b8956e" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="470" y1="240" x2="518" y2="240" stroke="#b8956e" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="470" y1="255" x2="510" y2="255" stroke="#b8956e" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="470" y1="270" x2="515" y2="270" stroke="#b8956e" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <line x1="470" y1="285" x2="490" y2="285" stroke="#b8956e" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
      <line x1="470" y1="300" x2="505" y2="300" stroke="#b8956e" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
    </svg>
  );
}

export function DashboardIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="dash-glow" cx="50%" cy="50%">
          <stop stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="dash-chart" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <circle cx="200" cy="150" r="160" fill="url(#dash-glow)" opacity="0.04" />

      <rect x="30" y="25" width="340" height="8" rx="4" fill="currentColor" opacity="0.08" />
      <circle cx="42" cy="29" r="2.5" fill="currentColor" opacity="0.15" />
      <rect x="55" y="27" width="60" height="4" rx="2" fill="currentColor" opacity="0.06" />

      <rect x="30" y="50" width="50" height="230" rx="6" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeWidth="1" strokeOpacity="0.08" />
      <rect x="40" y="65" width="30" height="4" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="40" y="80" width="30" height="4" rx="2" fill="currentColor" opacity="0.1" />
      <rect x="40" y="95" width="30" height="4" rx="2" fill="currentColor" opacity="0.1" />
      <rect x="40" y="110" width="30" height="4" rx="2" fill="currentColor" opacity="0.1" />

      <rect x="95" y="55" width="90" height="65" rx="6" fill="#ffffff" stroke="currentColor" strokeWidth="1" opacity="0.12" />
      <rect x="105" y="65" width="20" height="20" rx="4" fill="currentColor" opacity="0.15" />
      <rect x="132" y="67" width="40" height="4" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="132" y="76" width="30" height="3" rx="1.5" fill="currentColor" opacity="0.08" />
      <text x="110" y="100" fontSize="18" fontWeight="700" fill="currentColor" opacity="0.5" fontFamily="system-ui">128</text>
      <rect x="105" y="108" width="30" height="3" rx="1.5" fill="currentColor" opacity="0.1" />

      <rect x="195" y="55" width="90" height="65" rx="6" fill="#ffffff" stroke="currentColor" strokeWidth="1" opacity="0.12" />
      <rect x="205" y="65" width="20" height="20" rx="4" fill="#7ea8c4" opacity="0.15" />
      <rect x="232" y="67" width="40" height="4" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="232" y="76" width="30" height="3" rx="1.5" fill="currentColor" opacity="0.08" />
      <text x="210" y="100" fontSize="18" fontWeight="700" fill="currentColor" opacity="0.5" fontFamily="system-ui">45</text>
      <rect x="205" y="108" width="30" height="3" rx="1.5" fill="currentColor" opacity="0.1" />

      <rect x="295" y="55" width="80" height="65" rx="6" fill="#ffffff" stroke="currentColor" strokeWidth="1" opacity="0.12" />
      <rect x="305" y="65" width="20" height="20" rx="4" fill="#b8956e" opacity="0.15" />
      <rect x="332" y="67" width="40" height="4" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="332" y="76" width="30" height="3" rx="1.5" fill="currentColor" opacity="0.08" />
      <text x="310" y="100" fontSize="18" fontWeight="700" fill="currentColor" opacity="0.5" fontFamily="system-ui">8</text>
      <rect x="305" y="108" width="30" height="3" rx="1.5" fill="currentColor" opacity="0.1" />

      <rect x="95" y="135" width="200" height="145" rx="6" fill="#ffffff" stroke="currentColor" strokeWidth="1" opacity="0.08" />
      <rect x="108" y="150" width="40" height="4" rx="2" fill="currentColor" opacity="0.12" />

      <rect x="110" y="170" width="24" height="70" rx="3" fill="url(#dash-chart)" stroke="currentColor" strokeWidth="1.5" />
      <rect x="142" y="195" width="24" height="45" rx="3" fill="url(#dash-chart)" stroke="currentColor" strokeWidth="1.5" />
      <rect x="174" y="160" width="24" height="80" rx="3" fill="url(#dash-chart)" stroke="currentColor" strokeWidth="1.5" />
      <rect x="206" y="185" width="24" height="55" rx="3" fill="url(#dash-chart)" stroke="currentColor" strokeWidth="1.5" />
      <rect x="238" y="205" width="24" height="35" rx="3" fill="url(#dash-chart)" stroke="currentColor" strokeWidth="1.5" />

      <line x1="108" y1="250" x2="268" y2="250" stroke="currentColor" strokeWidth="1" opacity="0.08" />

      <rect x="310" y="135" width="55" height="145" rx="6" fill="#ffffff" stroke="currentColor" strokeWidth="1" opacity="0.08" />
      <rect x="320" y="148" width="35" height="4" rx="2" fill="#7ea8c4" opacity="0.3" />
      <rect x="320" y="162" width="35" height="3" rx="1.5" fill="currentColor" opacity="0.08" />
      <rect x="320" y="175" width="35" height="3" rx="1.5" fill="currentColor" opacity="0.08" />
      <rect x="320" y="195" width="20" height="20" rx="4" fill="#7ea8c4" opacity="0.1" />
      <rect x="320" y="225" width="20" height="20" rx="4" fill="#b8956e" opacity="0.1" />
      <rect x="320" y="255" width="20" height="20" rx="4" fill="#8b9d83" opacity="0.1" />

      <circle cx="400" cy="29" r="2.5" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

export function EmptyCasesIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="cases-glow" cx="50%" cy="50%">
          <stop stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <circle cx="150" cy="100" r="90" fill="url(#cases-glow)" opacity="0.04" />

      <rect x="80" y="50" width="140" height="105" rx="8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.15" strokeDasharray="6 4" />
      <rect x="85" y="55" width="130" height="95" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.08" />

      <path d="M110 50 L110 35 L190 35 L190 50" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.15" strokeLinejoin="round" />
      <line x1="130" y1="42" x2="170" y2="42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.1" />

      <line x1="110" y1="80" x2="190" y2="80" stroke="currentColor" strokeWidth="1.5" opacity="0.08" strokeLinecap="round" />
      <line x1="110" y1="95" x2="180" y2="95" stroke="currentColor" strokeWidth="1.5" opacity="0.06" strokeLinecap="round" />
      <line x1="110" y1="110" x2="170" y2="110" stroke="currentColor" strokeWidth="1.5" opacity="0.05" strokeLinecap="round" />

      <circle cx="150" cy="130" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
      <line x1="158" y1="138" x2="164" y2="144" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

      <circle cx="60" cy="170" r="2" fill="currentColor" opacity="0.12" />
      <circle cx="240" cy="50" r="2" fill="#7ea8c4" opacity="0.1" />
    </svg>
  );
}

export function EmptyDocsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="edocs-glow" cx="50%" cy="50%">
          <stop stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <circle cx="150" cy="100" r="90" fill="url(#edocs-glow)" opacity="0.04" />

      <path d="M95 45 L155 45 L175 65 L175 155 L95 155 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" opacity="0.12" strokeDasharray="6 4" />
      <path d="M155 45 L155 65 L175 65" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" opacity="0.12" strokeDasharray="6 4" />

      <line x1="108" y1="80" x2="162" y2="80" stroke="currentColor" strokeWidth="1.5" opacity="0.06" strokeLinecap="round" />
      <line x1="108" y1="95" x2="152" y2="95" stroke="currentColor" strokeWidth="1.5" opacity="0.05" strokeLinecap="round" />
      <line x1="108" y1="110" x2="158" y2="110" stroke="currentColor" strokeWidth="1.5" opacity="0.04" strokeLinecap="round" />
      <line x1="108" y1="125" x2="130" y2="125" stroke="currentColor" strokeWidth="1.5" opacity="0.04" strokeLinecap="round" />

      <circle cx="200" cy="120" r="30" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2" />
      <circle cx="200" cy="120" r="22" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.12" />
      <line x1="222" y1="142" x2="232" y2="152" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      <line x1="195" y1="115" x2="195" y2="125" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <line x1="190" y1="120" x2="200" y2="120" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

      <circle cx="85" cy="170" r="2" fill="#7ea8c4" opacity="0.1" />
      <circle cx="230" cy="60" r="2" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

export function LegalPatternSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g opacity="0.08">
        <line x1="12" y1="25" x2="12" y2="18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M7 25 L12 18 L17 25" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
        <line x1="7" y1="25" x2="17" y2="25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

        <line x1="62" y1="25" x2="62" y2="18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M57 25 L62 18 L67 25" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
        <line x1="57" y1="25" x2="67" y2="25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

        <line x1="112" y1="25" x2="112" y2="18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M107 25 L112 18 L117 25" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
        <line x1="107" y1="25" x2="117" y2="25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

        <line x1="162" y1="25" x2="162" y2="18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M157 25 L162 18 L167 25" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
        <line x1="157" y1="25" x2="167" y2="25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

        <rect x="28" y="55" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M34 55 L34 71" stroke="currentColor" strokeWidth="1" />
        <path d="M28 61 L40 61" stroke="currentColor" strokeWidth="1" />

        <rect x="78" y="55" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M84 55 L84 71" stroke="currentColor" strokeWidth="1" />
        <path d="M78 61 L90 61" stroke="currentColor" strokeWidth="1" />

        <rect x="128" y="55" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M134 55 L134 71" stroke="currentColor" strokeWidth="1" />
        <path d="M128 61 L140 61" stroke="currentColor" strokeWidth="1" />

        <text x="44" y="50" fontSize="10" fill="currentColor" fontFamily="serif" textAnchor="middle">¶</text>
        <text x="94" y="50" fontSize="10" fill="currentColor" fontFamily="serif" textAnchor="middle">¶</text>
        <text x="144" y="50" fontSize="10" fill="currentColor" fontFamily="serif" textAnchor="middle">¶</text>
        <text x="194" y="50" fontSize="10" fill="currentColor" fontFamily="serif" textAnchor="middle">¶</text>
      </g>
    </svg>
  );
}
