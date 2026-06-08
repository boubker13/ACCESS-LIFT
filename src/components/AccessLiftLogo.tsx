import React from "react";

interface AccessLiftLogoProps {
  className?: string;
  showText?: boolean;
  inline?: boolean;
  lang?: "ar" | "fr";
}

export default function AccessLiftLogo({ className = "", showText = true, inline = false, lang = "ar" }: AccessLiftLogoProps) {
  return (
    <div className={`flex ${inline ? "flex-row items-center gap-3" : "flex-col items-center"} justify-center ${className}`} id="access-lift-logo">
      {/* Pristine high-fidelity SVG mimicking the requested ACCESS LIFT logo exactly */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${inline ? "w-16 h-12" : "w-64 h-48"} transition-transform hover:scale-105 duration-300`}
        id="logo-svg"
      >
        <defs>
          <linearGradient id="busGrad" x1="120" y1="120" x2="400" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" /> {/* Royal Blue */}
            <stop offset="50%" stopColor="#0284C7" /> {/* Sky Blue */}
            <stop offset="100%" stopColor="#0891B2" /> {/* Cyan */}
          </linearGradient>
          <linearGradient id="wheelchairGrad" x1="450" y1="180" x2="520" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <linearGradient id="rampGrad" x1="380" y1="260" x2="520" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="waveGrad" x1="150" y1="280" x2="500" y2="340" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
          <linearGradient id="windowGrad" x1="130" y1="130" x2="350" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#172554" stopOpacity="0.95" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Behind-shadow / ground reflection waves */}
        <path
          d="M 120,270 C 120,270 300,260 510,270 C 530,271 520,278 480,282 C 400,290 200,290 120,270 Z"
          fill="#1E293B"
          opacity="0.8"
        />
        
        {/* Curved swish underneath */}
        <path
          d="M 170,290 C 220,350 420,350 510,295 C 470,335 300,345 170,290 Z"
          fill="url(#waveGrad)"
        />
        <path
          d="M 150,295 C 200,380 440,360 520,300 C 470,355 280,365 150,295 Z"
          fill="url(#waveGrad)"
          opacity="0.25"
        />

        {/* 2. THE BUS BODY */}
        <g id="bus-body-group">
          {/* Main Bus Form (Chassis & Roof) facing right with angle */}
          <path
            d="M 120,165 
               C 120,140 135,130 155,130 
               L 410,120 
               C 425,120 445,130 450,140 
               L 455,230 
               C 455,248 440,250 425,250 
               L 130,255 
               C 120,255 120,240 120,230 
               Z"
            fill="url(#busGrad)"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Windshield & Windows */}
          {/* Front windshield */}
          <path
            d="M 415,128 
               L 443,142 
               L 440,215 
               L 412,205 
               Z"
            fill="#38BDF8"
            opacity="0.9"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          {/* Passenger Windows */}
          <path
            d="M 130,140 
               L 403,131 
               L 403,195 
               L 130,195 
               Z"
            fill="url(#windowGrad)"
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* Window dividers to make it realistic */}
          <line x1="180" y1="138" x2="180" y2="195" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
          <line x1="240" y1="136" x2="240" y2="195" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
          <line x1="300" y1="134" x2="300" y2="195" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
          <line x1="360" y1="132" x2="360" y2="195" stroke="#ffffff" strokeWidth="2" opacity="0.8" />

          {/* Headlights and grille */}
          <path d="M 448,218 L 452,228 L 442,226 Z" fill="#FDE047" filter="url(#glow)" />
          <rect x="420" y="225" width="22" height="6" rx="2" fill="#334155" />

          {/* Rear-view mirrors */}
          <path d="M 430,118 Q 448,110 448,125" stroke="#000" strokeWidth="3" fill="none" />
          <rect x="445" y="123" width="6" height="15" rx="2" fill="#000" />

          {/* Wheel Wells and Wheels */}
          {/* Wheel 1 (Back) */}
          <circle cx="165" cy="250" r="30" fill="#0F172A" />
          <circle cx="165" cy="250" r="24" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
          <circle cx="165" cy="250" r="10" fill="#94A3B8" />
          
          {/* Wheel 2 (Front) */}
          <circle cx="345" cy="245" r="30" fill="#0F172A" />
          <circle cx="345" cy="245" r="24" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
          <circle cx="345" cy="245" r="10" fill="#94A3B8" />

          {/* White Accessibility Logo painted on the bus side */}
          <g transform="translate(235, 203) scale(0.6)" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round">
            {/* Wheel */}
            <circle cx="30" cy="30" r="12" strokeWidth="4" />
            {/* Head */}
            <circle cx="30" cy="10" r="3" fill="#ffffff" stroke="none" />
            {/* Spine & Arms */}
            <path d="M 27,18 L 33,18 L 38,24 M 27,18 A 6,6 0 0,0 27,28 L 34,28" strokeWidth="3" />
          </g>
        </g>

        {/* 3. WHEELCHAIR LIFT RAMP IN DEPLOYMENT */}
        <g id="lift-ramp-group">
          {/* Rear bus door opening where lift operates */}
          <rect x="390" y="200" width="18" height="42" rx="1" fill="#0F172A" />
          
          {/* Deployment Ramp coming down */}
          <path
            d="M 390,240 
               L 490,265 
               C 498,267 498,272 490,273 
               L 390,246 
               Z"
            fill="url(#rampGrad)"
            stroke="#06B6D4"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Yellow Hazard caution lines on ramp edge */}
          <line x1="395" y1="243" x2="485" y2="266" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="4,4" />
          <line x1="395" y1="245" x2="485" y2="268" stroke="#EAB308" strokeWidth="1.5" strokeDasharray="4,4" />
        </g>

        {/* 4. THE WHEELCHAIR PASSENGER MOVING ON THE RAMP */}
        <g id="passenger-wheelchair" transform="translate(145, -2) scale(1.05)">
          {/* Main wheel */}
          <circle cx="300" cy="235" r="22" stroke="url(#wheelchairGrad)" strokeWidth="5.5" fill="none" />
          <circle cx="300" cy="235" r="17" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.6" />
          {/* Spokes */}
          <line x1="300" y1="213" x2="300" y2="257" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
          <line x1="278" y1="235" x2="322" y2="235" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
          <line x1="285" y1="220" x2="315" y2="250" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
          <line x1="285" y1="250" x2="315" y2="220" stroke="#ffffff" strokeWidth="1" opacity="0.4" />

          {/* Small castor front wheel */}
          <circle cx="335" cy="248" r="6" stroke="url(#wheelchairGrad)" strokeWidth="3" fill="none" />

          {/* Chair frame */}
          <path
            d="M 285,210 
               L 310,210 
               L 322,235 
               L 335,235"
            stroke="url(#wheelchairGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Push handle support */}
          <line x1="285" y1="210" x2="280" y2="195" stroke="url(#wheelchairGrad)" strokeWidth="4" strokeLinecap="round" />

          {/* THE DISABLED CITIZEN (HUMAN FIGURE) */}
          {/* Head */}
          <circle cx="312" cy="172" r="7.5" fill="#0EA5E9" />
          {/* Torso */}
          <path
            d="M 300,195 
               C 305,182 312,182 312,182 
               L 315,208"
            stroke="#0EA5E9"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Thighs & Knees */}
          <path
            d="M 310,208 
               L 332,208 
               L 338,230"
            stroke="#38BDF8"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Arms holding the wheel controls */}
          <path
            d="M 311,188 
               L 324,198 
               L 315,218"
            stroke="#38BDF8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>

      {/* Styled Brand Text exactly mimicking the requested image typography layout */}
      {showText && (
        <div className="text-center mt-2 font-english" id="logo-branding-words">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-black italic tracking-tighter text-white">ACCESS</span>
            <span className="text-3xl font-black italic tracking-tighter text-cyan-400">LIFT</span>
          </div>
          <div className="text-[10px] uppercase font-bold tracking-[0.25em] text-emerald-400 mt-1 font-arabic">
            {lang === "ar" ? "للرافعات والتجهيزات المتكاملة" : "Solutions d'Accessibilité PMR"}
          </div>
        </div>
      )}
    </div>
  );
}
