// 24×24 line icons (1.75 stroke), drawn in currentColor.
const PATHS = {
  "arrow-left": "M19 12H5m6-6-6 6 6 6",
  "arrow-right": "M5 12h14m-6-6 6 6-6 6",
  check: "m5 12.5 4.5 4.5L19 7.5",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m11.32 0 1.41 1.41M4.93 4.93l1.41 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  maximize: "M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5",
  minimize: "M9 4v5H4m16 0h-5V4m0 16v-5h5M4 15h5v5",
  image: "M4 5h16v14H4zM4 16l4.5-4.5 3.5 3.5 2.5-2.5L20 18M15.5 9.5h.01",
  share: "M12 3v12m-4.5-7.5L12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6",
  volume: "M4 9.5v5h3.5L12 19V5L7.5 9.5H4Zm12 -1a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12",
  stop: "M7 7h10v10H7z",
  flip: "M4 12a8 8 0 0 1 13.66-5.66L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.66 5.66L4 15.5M4 20v-4.5h4.5",
  search: "m20 20-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
  "chevron-down": "m6 9 6 6 6-6",
  printer: "M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z",
  download: "M12 3v12m-4.5-4.5L12 15l4.5-4.5M5 21h14",
  "text-smaller": "M4 18 8.5 6 13 18M5.7 14h5.6M16 12h5",
  "text-larger": "M4 18 8.5 6 13 18M5.7 14h5.6M16 12h5m-2.5-2.5v5",
};

export default function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
