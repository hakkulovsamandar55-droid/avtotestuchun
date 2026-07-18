import React from "react";
import { ACCENT_FROM, ACCENT_TO } from "../theme";

// Logotip — TezPrava avtomobil belgisi, gradient fonda
export default function GradientIcon() {
  return (
    <div
      className="w-20 h-20 rounded-[22px] flex items-center justify-center shadow-lg shadow-purple-900/30"
      style={{
        background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
      }}
    >
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 16.5 L6 10 Q7 8 9 8 H15 Q17 8 18 10 L20 16.5"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 16.5 H20.5 V17.8 Q20.5 18.5 19.8 18.5 H4.2 Q3.5 18.5 3.5 17.8 Z"
          stroke="white"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="7.5" cy="18.5" r="1.1" fill="white" />
        <circle cx="16.5" cy="18.5" r="1.1" fill="white" />
      </svg>
    </div>
  );
}
