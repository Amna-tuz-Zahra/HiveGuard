export default function HoneycombLogo({ size = 28, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Center hexagon */}
      <path
        d="M24 8L31.5 12.5V21.5L24 26L16.5 21.5V12.5L24 8Z"
        fill={color}
        opacity="0.9"
      />
      {/* Top-right hexagon */}
      <path
        d="M33 4L40.5 8.5V17.5L33 22L25.5 17.5V8.5L33 4Z"
        fill={color}
        opacity="0.6"
      />
      {/* Bottom-left hexagon */}
      <path
        d="M15 22L22.5 26.5V35.5L15 40L7.5 35.5V26.5L15 22Z"
        fill={color}
        opacity="0.6"
      />
      {/* Top-left hexagon */}
      <path
        d="M15 4L22.5 8.5V17.5L15 22L7.5 17.5V8.5L15 4Z"
        fill={color}
        opacity="0.4"
      />
      {/* Bottom-right hexagon */}
      <path
        d="M33 22L40.5 26.5V35.5L33 40L25.5 35.5V26.5L33 22Z"
        fill={color}
        opacity="0.4"
      />
      {/* Bottom-center hexagon */}
      <path
        d="M24 26L31.5 30.5V39.5L24 44L16.5 39.5V30.5L24 26Z"
        fill={color}
        opacity="0.7"
      />
    </svg>
  );
}
