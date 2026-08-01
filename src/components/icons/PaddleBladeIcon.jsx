import React from 'react';

/**
 * Reusable Vector Stand-Up Paddleboard Blade (Sirip / Daun Dayung SUP) Icon
 */
export default function PaddleBladeIcon({ size = 24, color = '#0284c7', className = '', style = {} }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* SUP Paddle Shaft Top */}
      <path 
        d="M11 2H13V7H11V2Z" 
        fill={color} 
      />
      {/* Teardrop Ergonomic SUP Paddle Blade / Sirip Dayung */}
      <path 
        d="M12 7C8.5 7 6 10.5 6 14.5C6 18.5 8.5 22 12 22C15.5 22 18 18.5 18 14.5C18 10.5 15.5 7 12 7Z" 
        fill={color} 
      />
      {/* Center Rib Spine Highlight Line */}
      <path 
        d="M12 4V20" 
        stroke="white" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        opacity="0.85" 
      />
    </svg>
  );
}
