
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const FootPulseLogo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="shieldGradient" x1="256" y1="50" x2="256" y2="450" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0079AD" />
            <stop offset="60%" stopColor="#004E72" />
            <stop offset="100%" stopColor="#00A859" />
          </linearGradient>
          
          <filter id="pulseGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. SHIELD BACKGROUND */}
        <path 
          d="M256 30C180 30 110 55 60 95V240C60 360 140 440 256 480C372 440 452 360 452 240V95C402 55 332 30 256 30Z" 
          fill="url(#shieldGradient)" 
          stroke="#001F33" 
          strokeWidth="12"
        />

        {/* 2. INNER SHIELD DETAIL */}
        <path 
          d="M256 50C190 50 130 72 85 105V240C85 340 150 410 256 455C362 410 427 340 427 240V105C382 72 322 50 256 50Z" 
          fill="black" 
          fillOpacity="0.1"
        />

        {/* 3. FOOTBALL (SOCCER BALL) */}
        <g transform="translate(256, 230)">
          {/* Main Circle */}
          <circle r="110" fill="white" stroke="#001F33" strokeWidth="4" />
          
          {/* Pentagons / Hexagons Structure */}
          <path d="M0 -110 L25 -85 L0 -60 L-25 -85 Z" fill="#001F33" />
          <path d="M0 -60 L35 -45 L35 0 L-35 0 L-35 -45 Z" fill="none" stroke="#001F33" strokeWidth="4" />
          <path d="M35 -45 L70 -65 L105 -35 L80 -5 Z" fill="#001F33" />
          <path d="M-35 -45 L-70 -65 L-105 -35 L-80 -5 Z" fill="#001F33" />
          <path d="M35 0 L65 20 L50 60 L15 50 L0 15" fill="none" stroke="#001F33" strokeWidth="4" />
          <path d="M-35 0 L-65 20 L-50 60 L-15 50 L0 15" fill="none" stroke="#001F33" strokeWidth="4" />
          <path d="M0 110 L-25 85 L0 60 L25 85 Z" fill="#001F33" />
          <path d="M75 55 L108 25 L100 80 L65 100 Z" fill="#001F33" />
          <path d="M-75 55 L-108 25 L-100 80 L-65 100 Z" fill="#001F33" />
        </g>

        {/* 4. PULSE LINE (HEARTBEAT) */}
        <path 
          d="M40 240 H 140 L 165 210 L 195 320 L 230 180 L 270 290 L 320 180 L 350 270 L 380 230 L 400 250 H 472" 
          stroke="#7BC242" 
          strokeWidth="14" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#pulseGlow)"
        />
        
        {/* White outline for the pulse to make it pop against the ball */}
        <path 
          d="M40 240 H 140 L 165 210 L 195 320 L 230 180 L 270 290 L 320 180 L 350 270 L 380 230 L 400 250 H 472" 
          stroke="white" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          opacity="0.3"
        />
      </svg>
    </div>
  );
};

export default FootPulseLogo;
