import React from "react";

interface ProgressRingProps {
  size?: number; // diameter in px
  strokeWidth?: number;
  percentage: number; // 0-100
  color?: string; // css color, default uses CSS var --primary
  backgroundColor?: string; // track color
  children?: React.ReactNode; // content centered inside
  className?: string;
}

export function ProgressRing({
  size = 180,
  strokeWidth = 8,
  percentage,
  color = "var(--primary)",
  backgroundColor = "var(--accent)",
  children,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: "relative" }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          stroke={backgroundColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

