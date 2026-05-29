import React from 'react';

function TabrosIcon({ size = 28, sx = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="TABROS"
      focusable="false"
      style={{ display: 'block', ...sx }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 39.4h38.3c2.8 0 5.1-2.3 5.1-5.1 0-1.4-.6-2.8-1.6-3.8L46 21.7c-1.7-1.7-4-2.7-6.4-2.7H27c-2.9 0-5.6 1.4-7.3 3.7L10 35.6c-1.1 1.5 0 3.8 3 3.8Z"
        fill="#fff"
        opacity=".96"
      />
      <path
        d="M24.5 24.8c.8-1 2-1.6 3.3-1.6h10.8c1.2 0 2.4.5 3.2 1.4l5.8 6H20.1l4.4-5.8Z"
        fill="#1565c0"
      />
      <path
        d="M9.7 39.2h45.5c1.9 0 3.5 1.6 3.5 3.5v.7c0 1.9-1.6 3.5-3.5 3.5H8.8c-1.9 0-3.5-1.6-3.5-3.5v-.7c0-2 1.8-3.6 4.4-3.5Z"
        fill="#fff"
      />
      <path
        d="M19.8 48.5a5.8 5.8 0 1 0 0-11.6 5.8 5.8 0 0 0 0 11.6ZM45.1 48.5a5.8 5.8 0 1 0 0-11.6 5.8 5.8 0 0 0 0 11.6Z"
        fill="#0d47a1"
      />
      <path
        d="M19.8 45.2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM45.1 45.2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        fill="#90caf9"
      />
      <path
        d="M31.3 16.1h18.9M45.6 12.2l4.6 3.9-4.6 3.9"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31.3 16.1h18.9M45.6 12.2l4.6 3.9-4.6 3.9"
        stroke="#90caf9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default TabrosIcon;
