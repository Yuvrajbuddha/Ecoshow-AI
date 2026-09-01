import React from 'react';
import { motion } from 'motion/react';

export const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto flex items-center justify-center p-4">
      {/* Subtle organic background ambient glow */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-100/60 via-teal-50/40 to-emerald-200/30 rounded-3xl blur-2xl -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-100/80 shadow-xl shadow-emerald-950/5 p-6 overflow-hidden"
      >
        <svg
          viewBox="0 0 500 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto drop-shadow-sm select-none"
        >
          {/* Subtle Grid / Floor Line */}
          <line x1="30" y1="330" x2="470" y2="330" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />

          {/* Waste Containers / Bins (Recycle Blue, Organic Green, General Gray) */}
          {/* Bin 1: Blue Recyclables */}
          <g transform="translate(60, 200)">
            <rect x="0" y="20" width="65" height="105" rx="8" fill="#3B82F6" opacity="0.9" />
            <rect x="-4" y="10" width="73" height="14" rx="4" fill="#2563EB" />
            <path
              d="M32.5 50 L38 60 L35 60 L35 70 L30 70 L30 60 L27 60 Z"
              fill="#FFFFFF"
              opacity="0.9"
            />
            {/* Bin label */}
            <text x="32.5" y="95" fill="#DBEAFE" fontSize="9" fontWeight="600" textAnchor="middle">
              RECYCLE
            </text>
          </g>

          {/* Bin 2: Green Organics */}
          <g transform="translate(145, 185)">
            <rect x="0" y="20" width="70" height="120" rx="8" fill="#10B981" opacity="0.95" />
            <rect x="-4" y="10" width="78" height="14" rx="4" fill="#059669" />
            {/* Leaf symbol */}
            <path
              d="M35 48 C45 48 50 58 45 68 C35 68 30 58 35 48 Z M35 50 C32 60 38 66 42 66"
              stroke="#FFFFFF"
              strokeWidth="2"
              fill="none"
            />
            <text x="35" y="105" fill="#D1FAE5" fontSize="9" fontWeight="600" textAnchor="middle">
              ORGANIC
            </text>
          </g>

          {/* Smartphone Frame (AI Scanner Centerpiece) */}
          <g transform="translate(250, 45)">
            {/* Phone Body */}
            <rect x="0" y="0" width="160" height="275" rx="28" fill="#0F172A" />
            <rect x="4" y="4" width="152" height="267" rx="24" fill="#0B3B24" />

            {/* Screen Content */}
            <rect x="8" y="12" width="144" height="251" rx="18" fill="#F8FAF8" />

            {/* Phone Speaker & Camera Notch */}
            <rect x="52" y="18" width="56" height="5" rx="2.5" fill="#334155" />
            <circle cx="118" cy="20" r="2.5" fill="#334155" />

            {/* Scanner Viewfinder Box */}
            <rect
              x="22"
              y="45"
              width="116"
              height="125"
              rx="12"
              fill="#ECFDF5"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />

            {/* Target Reticle corners */}
            <path d="M28 58 L28 50 L36 50" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M132 58 L132 50 L124 50" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M28 157 L28 165 L36 165" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M132 157 L132 165 L124 165" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />

            {/* Scanning Laser Beam Line */}
            <motion.line
              x1="26"
              y1="60"
              x2="134"
              y2="60"
              stroke="#10B981"
              strokeWidth="2"
              strokeOpacity="0.85"
              animate={{ y1: [60, 155, 60], y2: [60, 155, 60] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            />

            {/* Waste Items Inside Viewfinder */}
            {/* Plastic Water Bottle */}
            <g transform="translate(68, 70)">
              {/* Bottle Cap */}
              <rect x="8" y="0" width="8" height="5" rx="1.5" fill="#3B82F6" />
              <rect x="7" y="5" width="10" height="3" fill="#60A5FA" />
              {/* Bottle Body */}
              <path
                d="M5 8 C5 14 2 20 2 25 L2 65 C2 68 5 70 8 70 L16 70 C19 70 22 68 22 65 L22 25 C22 20 19 14 19 8 Z"
                fill="#93C5FD"
                fillOpacity="0.75"
                stroke="#3B82F6"
                strokeWidth="1.2"
              />
              {/* Bottle Label */}
              <rect x="3" y="32" width="18" height="16" fill="#FFFFFF" rx="2" />
              <line x1="6" y1="38" x2="18" y2="38" stroke="#3B82F6" strokeWidth="1.5" />
              <line x1="6" y1="42" x2="14" y2="42" stroke="#93C5FD" strokeWidth="1.2" />
            </g>

            {/* AI Recognition Badge overlay in phone */}
            <g transform="translate(18, 182)">
              <rect x="0" y="0" width="124" height="48" rx="8" fill="#FFFFFF" stroke="#D1FAE5" strokeWidth="1" />
              <circle cx="16" cy="18" r="8" fill="#D1FAE5" />
              <path d="M13 18 L15 20 L19 16" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
              <text x="30" y="16" fill="#0F172A" fontSize="9" fontWeight="700">
                PET Plastic Bottle
              </text>
              <text x="30" y="26" fill="#059669" fontSize="8" fontWeight="600">
                Recyclable (94% Match)
              </text>
              {/* Mini progress bar */}
              <rect x="10" y="34" width="104" height="4" rx="2" fill="#E2E8F0" />
              <rect x="10" y="34" width="98" height="4" rx="2" fill="#10B981" />
            </g>
          </g>

          {/* Banana Peel on floor */}
          <g transform="translate(195, 275)">
            <path
              d="M10 25 C20 10 35 15 45 30 C30 35 15 35 10 25 Z"
              fill="#FBBF24"
              stroke="#D97706"
              strokeWidth="1.5"
            />
            <path
              d="M25 15 C35 5 50 15 45 35 C40 30 30 20 25 15 Z"
              fill="#F59E0B"
              stroke="#D97706"
              strokeWidth="1.2"
            />
            <circle cx="43" cy="30" r="1.5" fill="#78350F" />
            <circle cx="28" cy="20" r="1" fill="#78350F" />
          </g>

          {/* Aluminum Soda Can */}
          <g transform="translate(425, 250)">
            <rect x="0" y="5" width="28" height="48" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
            <ellipse cx="14" cy="5" rx="14" ry="4" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
            <ellipse cx="14" cy="53" rx="14" ry="4" fill="#94A3B8" />
            <rect x="2" y="15" width="24" height="24" fill="#EF4444" rx="2" />
            <circle cx="14" cy="27" r="6" fill="#FFFFFF" fillOpacity="0.9" />
            {/* Pop tab */}
            <ellipse cx="14" cy="5" rx="4" ry="2" fill="#64748B" />
          </g>

          {/* Botanical leaves floating gracefully */}
          {/* Leaf 1 (Top Left) */}
          <motion.g
            animate={{ y: [-3, 3, -3], rotate: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            transform="translate(45, 70)"
          >
            <path
              d="M0 25 C0 10 20 0 35 5 C35 20 20 35 0 25 Z"
              fill="#10B981"
              fillOpacity="0.8"
            />
            <path d="M0 25 Q20 15 35 5" stroke="#047857" strokeWidth="1" fill="none" />
          </motion.g>

          {/* Leaf 2 (Right side) */}
          <motion.g
            animate={{ y: [3, -3, 3], rotate: [2, -2, 2] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            transform="translate(435, 120)"
          >
            <path
              d="M25 0 C10 0 0 15 5 28 C20 28 30 15 25 0 Z"
              fill="#059669"
              fillOpacity="0.75"
            />
            <path d="M25 0 Q15 15 5 28" stroke="#065F46" strokeWidth="1" fill="none" />
          </motion.g>

          {/* Recycling Arrow Motif (Top subtle watermark) */}
          <g transform="translate(185, 30) scale(0.65)" opacity="0.35">
            <path
              d="M30 10 L45 35 L35 35 C35 50 45 60 60 60 L60 70 C40 70 25 55 25 35 L15 35 Z"
              fill="#10B981"
            />
          </g>
        </svg>

        {/* Caption below graphic */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium px-2">
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Real-time Multimodal Vision Model
          </span>
          <span className="text-slate-400">94%+ Sorting Accuracy</span>
        </div>
      </motion.div>
    </div>
  );
};
