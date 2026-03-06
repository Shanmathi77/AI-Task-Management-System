// components/PyramidChart.jsx
import React from "react";

export default function PyramidChart({
  data = [],
  width = 420,
  height = 300,
}) {
  if (!data.length) return <div>No data</div>;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const padding = 40;
  const baseWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  return (
    <svg width={width} height={height} style={{ background: "#071018" }}>
      
      {/* Y axis */}
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="#fff"
      />

      {/* X axis */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#fff"
      />

      {/* Pyramid */}
      {data.map((d, i) => {
        const levelHeight = (d.value / maxVal) * chartHeight;
        const y = height - padding - levelHeight;
        const levelWidth = (d.value / maxVal) * baseWidth;

        return (
          <polygon
            key={i}
            points={`
              ${width / 2 - levelWidth / 2},${height - padding}
              ${width / 2 + levelWidth / 2},${height - padding}
              ${width / 2},${y}
            `}
            fill="rgba(76,175,80,0.65)"
            stroke="#ffffff"
            strokeWidth="1"
          />
        );
      })}

      {/* Y labels */}
      <text x={5} y={padding} fill="#fff" fontSize="12">High</text>
      <text x={5} y={height - padding} fill="#fff" fontSize="12">Low</text>

      {/* X label */}
      <text
        x={width / 2}
        y={height - 5}
        fill="#fff"
        fontSize="12"
        textAnchor="middle"
      >
        Time / Records
      </text>
    </svg>
  );
}
