import React from 'react';

export const FeijoaIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="55" rx="35" ry="40" fill="#8BC34A" />
    <path d="M50 15 L50 30" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
    <path d="M35 30 Q50 15 65 30" fill="#7CB342" stroke="#5D4037" strokeWidth="2" />
    <path d="M30 45 Q50 55 70 45" stroke="#689F38" strokeWidth="2" fill="none" />
    <path d="M25 60 Q50 70 75 60" stroke="#689F38" strokeWidth="2" fill="none" />
    <path d="M30 75 Q50 85 70 75" stroke="#689F38" strokeWidth="2" fill="none" />
  </svg>
);

export const FeijoaBucketIcon = ({ size = 40, count = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    {/* Bucket */}
    <path d="M20 40 L30 90 L70 90 L80 40 Z" fill="#795548" stroke="#5D4037" strokeWidth="2" />
    <path d="M15 40 L85 40" stroke="#5D4037" strokeWidth="4" />
    
    {/* Feijoas in bucket - show up to 3 based on count */}
    {count > 0 && (
      <ellipse cx="40" cy="65" rx="12" ry="15" fill="#8BC34A" />
    )}
    {count > 2 && (
      <ellipse cx="60" cy="65" rx="12" ry="15" fill="#8BC34A" />
    )}
    {count > 5 && (
      <ellipse cx="50" cy="50" rx="12" ry="15" fill="#8BC34A" />
    )}
  </svg>
);