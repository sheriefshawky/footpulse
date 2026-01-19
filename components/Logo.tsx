
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const FootPulseLogo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]"
      >
        <defs>
          {/* Neon Gradients */}
          <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>

          <linearGradient id="neonEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="neonGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Spherical Depth */}
          <radialGradient id="techSphere" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Glow Filters */}
          <filter id="hyperGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <clipPath id="innerBall">
            <circle cx="50" cy="50" r="45" />
          </clipPath>
        </defs>

        {/* 1. OUTER RIM LIGHTING */}
        <circle cx="50" cy="50" r="47" stroke="url(#neonCyan)" strokeWidth="0.5" opacity="0.3" />

        {/* 2. THE TECH-SPHERE BASE */}
        <circle cx="50" cy="50" r="45" fill="url(#techSphere)" />
        
        {/* 3. MULTI-COLORED HEX PANELS */}
        <g clipPath="url(#innerBall)" opacity="0.9">
          {/* Main Neon Panels */}
          <path d="M50 32 L65 40 L65 60 L50 68 L35 60 L35 40 Z" fill="url(#neonEmerald)" opacity="0.8" />
          
          {/* Peripheral Data-Panels */}
          <path d="M50 0 L70 15 L65 35 L50 32 L35 35 L30 15 Z" fill="#1e293b" stroke="url(#neonCyan)" strokeWidth="0.5" />
          <path d="M78 20 L100 35 L95 65 L78 75 L65 60 L65 40 Z" fill="#1e293b" stroke="url(#neonCyan)" strokeWidth="0.5" />
          <path d="M22 20 L0 35 L5 65 L22 75 L35 60 L35 40 Z" fill="#1e293b" stroke="url(#neonCyan)" strokeWidth="0.5" />
          <path d="M50 100 L70 85 L65 65 L50 68 L35 65 L30 85 Z" fill="#1e293b" stroke="url(#neonCyan)" strokeWidth="0.5" />
        </g>

        {/* 4. THE DNA HELIX (Vibrant Intertwined Strands) */}
        <g filter="url(#hyperGlow)">
          {/* Helix A: Electric Cyan */}
          <path 
            d="M30 15 C 70 35, 30 65, 70 85" 
            stroke="url(#neonCyan)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            opacity="0.9"
          >
            <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
          </path>
          {/* Helix B: Vibrant Gold */}
          <path 
            d="M70 15 C 30 35, 70 65, 30 85" 
            stroke="url(#neonGold)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            opacity="0.7"
          >
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
          </path>
        </g>

        {/* 5. ANALYTICS DATA NODES (Floating Glowing Points) */}
        <circle cx="50" cy="12" r="2.5" fill="#fff" filter="url(#hyperGlow)" />
        <circle cx="50" cy="88" r="2.5" fill="#fff" filter="url(#hyperGlow)" />
        <circle cx="15" cy="50" r="2" fill="url(#neonGold)" />
        <circle cx="85" cy="50" r="2" fill="url(#neonGold)" />

        {/* 6. KINETIC PULSE TRAIL */}
        <path 
          d="M10 50 H 90" 
          stroke="#fff" 
          strokeWidth="1" 
          strokeDasharray="1 15" 
          strokeLinecap="round" 
          opacity="0.8"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="16" dur="0.8s" repeatCount="indefinite" />
        </path>

        {/* 7. PERFORMANCE RADAR SCAN */}
        <path 
          d="M50 5 A 45 45 0 0 1 95 50" 
          stroke="url(#neonCyan)" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          opacity="0.5"
        >
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 50 50" 
            to="360 50 50" 
            dur="4s" 
            repeatCount="indefinite" 
          />
        </path>
        
        {/* Horizontal Data Bars */}
        <rect x="40" y="38" width="20" height="2" rx="1" fill="#fff" opacity="0.4">
            <animate attributeName="width" values="10;30;10" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="x" values="45;35;45" dur="1.5s" repeatCount="indefinite" />
        </rect>
      </svg>
    </div>
  );
};

export default FootPulseLogo;
