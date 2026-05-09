import React from 'react';

const RileyIcon = ({ className = "w-6 h-6", color = "currentColor" }) => (
  <svg 
    viewBox="0 0 100 100" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Stylized Riley Silhouette with Cornrows */}
    <g fill={color}>
      {/* Face/Head Shape */}
      <path d="M50 20C35 20 22 32 22 48C22 60 28 72 38 78C42 81 46 82 50 82C54 82 58 81 62 78C72 72 78 60 78 48C78 32 65 20 50 20Z" opacity="0.1" />
      
      {/* Hair (Cornrows) - Stylized geometric paths */}
      <path d="M30 25C30 25 35 15 50 15C65 15 70 25 70 25L75 35L70 40L30 40L25 35L30 25Z" />
      <path d="M25 45L75 45L80 50L75 55L25 55L20 50L25 45Z" />
      
      {/* Eyes (That classic Riley glare) */}
      <path d="M35 60L45 62" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M65 60L55 62" stroke={color} strokeWidth="3" strokeLinecap="round" />
      
      {/* Mouth (Frown/Neutral) */}
      <path d="M45 72C45 72 48 70 50 70C52 70 55 72 55 72" stroke={color} strokeWidth="2" strokeLinecap="round" />
      
      {/* Chain/Bling (Minimalist) */}
      <circle cx="50" cy="90" r="5" fill="#FFD700" />
      <path d="M40 82L50 90L60 82" stroke="#FFD700" strokeWidth="2" fill="none" />
    </g>
  </svg>
);

export default RileyIcon;
