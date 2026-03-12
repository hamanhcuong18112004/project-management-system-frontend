"use client";

import React from "react";

const NAVY = "#1e3a5f";
const YELLOW = "#eab308";

/**
 * Logo CHAAX - với nền navy, chữ tô màu, viền trắng tạo phân tách
 * @param size - Kích thước logo (mặc định 320px)
 */
export function Logo({ scale = 1 }: { scale?: number }) {
  const fontSize = 85 * scale;
  const innerW = 143 * scale;
  const innerH = 117 * scale;
  const padding = 10 * scale;
  const borderGap = 4 * scale;
  const borderW = 2 * scale;
  const strokeW = 2.5 * scale;

  const outerW = innerW + padding * 2;
  const outerH = innerH + padding * 2;

  const baseStyle = (left: number, top: number, color: string): React.CSSProperties => ({
    left: left * scale,
    top: top * scale,
    fontSize: `${fontSize}px`,
    fontWeight: 700,
    color: color,
    lineHeight: "normal",
    fontFamily: "'Inter', sans-serif",
    WebkitTextStroke: `${strokeW}px white`,
    paintOrder: "stroke fill",
  });

  return (
    <div className="flex flex-col items-center gap-6"
      style={{
        marginLeft: -16 * scale,
      }}
    >
      {/* Outer border 2 (navy) */}
      <div
        className="flex items-center justify-center"
        style={{
          width: outerW + borderGap * 2 + borderW * 2,
          height: outerH + borderGap * 2 + borderW * 2,
          border: `${borderW}px solid ${NAVY}`,
          borderRadius: 18 * scale,
        }}
      >
        {/* Inner border 1 (navy) */}
        <div
          className="flex items-center justify-center"
          style={{
            width: outerW,
            height: outerH,
            border: `${borderW}px solid ${NAVY}`,
            borderRadius: 12 * scale,
            backgroundColor: NAVY,
          }}
        >
          {/* Logo letters */}
          <div
            className="relative"
            style={{
              width: innerW,
              height: innerH,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* C — navy fill, white stroke */}
            <span className="absolute select-none" style={baseStyle(11.5, 14.4, NAVY)}>
              C
            </span>
            {/* H — navy fill, white stroke, overlaps C */}
            <span className="absolute select-none" style={baseStyle(30.2, 14.4, NAVY)}>
              H
            </span>
            {/* A upright — yellow fill, white stroke */}
            <span className="absolute select-none" style={baseStyle(77.8, 14.4, YELLOW)}>
              A
            </span>
            {/* A inverted — yellow fill, white stroke */}
            <div
              className="absolute flex items-center justify-center select-none"
              style={{
                left: 76.8 * scale,
                top: 15.3 * scale,
              }}
            >
              <span
                style={{
                  fontSize: `${fontSize}px`,
                  fontWeight: 700,
                  color: YELLOW,
                  lineHeight: "normal",
                  fontFamily: "'Inter', sans-serif",
                  WebkitTextStroke: `${strokeW}px white`,
                  paintOrder: "stroke fill",
                  transform: "rotate(180deg)",
                  display: "block",
                }}
              >
                A
              </span>
            </div>
            {/* X — navy fill, white stroke, overlaps the two A's */}
            <span className="absolute select-none" style={baseStyle(78.8, 14.4, NAVY)}>
              X
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
