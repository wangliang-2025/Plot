/**
 * Liquid Glass — animated SVG morphing blobs.
 * Sits behind the page and gently shifts colour & shape.
 * Pure CSS animations + SVG morph via animate. No JS.
 */
export function BlobBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <svg
        className="absolute -top-[10%] -left-[15%] h-[70vh] w-[70vw]"
        style={{ animation: 'blob-1 22s var(--ease-fluid) infinite', filter: 'blur(60px)', opacity: 0.55 }}
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="blob-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--aurora-1))" />
            <stop offset="100%" stopColor="hsl(var(--aurora-3))" />
          </linearGradient>
        </defs>
        <path fill="url(#blob-grad-1)">
          <animate
            attributeName="d"
            dur="20s"
            repeatCount="indefinite"
            values="
              M421.5,316Q409,382,348.5,418Q288,454,221,433Q154,412,114.5,356Q75,300,113,242.5Q151,185,213,150.5Q275,116,343,135Q411,154,432,227Q453,300,421.5,316Z;
              M433,309Q414,378,353.5,418Q293,458,221,440Q149,422,114,361Q79,300,113,238Q147,176,213,142Q279,108,346,131Q413,154,439,227Q465,300,433,309Z;
              M421.5,316Q409,382,348.5,418Q288,454,221,433Q154,412,114.5,356Q75,300,113,242.5Q151,185,213,150.5Q275,116,343,135Q411,154,432,227Q453,300,421.5,316Z
            "
          />
        </path>
      </svg>

      <svg
        className="absolute top-[20%] -right-[10%] h-[60vh] w-[60vw]"
        style={{ animation: 'blob-2 26s var(--ease-fluid) infinite', filter: 'blur(80px)', opacity: 0.45 }}
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="blob-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--aurora-2))" />
            <stop offset="100%" stopColor="hsl(var(--aurora-4))" />
          </linearGradient>
        </defs>
        <path fill="url(#blob-grad-2)">
          <animate
            attributeName="d"
            dur="24s"
            repeatCount="indefinite"
            values="
              M447,316Q425,382,365,418Q305,454,234,440Q163,426,118,365Q73,304,116,243Q159,182,219,142Q279,102,348,128Q417,154,442,227Q467,300,447,316Z;
              M421,309Q414,378,353.5,418Q293,458,221,440Q149,422,114,361Q79,300,113,238Q147,176,213,142Q279,108,346,131Q413,154,439,227Q465,300,421,309Z;
              M447,316Q425,382,365,418Q305,454,234,440Q163,426,118,365Q73,304,116,243Q159,182,219,142Q279,102,348,128Q417,154,442,227Q467,300,447,316Z
            "
          />
        </path>
      </svg>

      <svg
        className="absolute -bottom-[15%] left-[20%] h-[55vh] w-[55vw]"
        style={{ animation: 'blob-3 30s var(--ease-fluid) infinite', filter: 'blur(70px)', opacity: 0.4 }}
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="blob-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--aurora-3))" />
            <stop offset="100%" stopColor="hsl(var(--aurora-2))" />
          </linearGradient>
        </defs>
        <path fill="url(#blob-grad-3)">
          <animate
            attributeName="d"
            dur="28s"
            repeatCount="indefinite"
            values="
              M412,304Q412,358,371,397Q330,436,265,438Q200,440,151,395Q102,350,113,283Q124,216,170,176Q216,136,282,130Q348,124,388,176Q428,228,420,266Q412,304,412,304Z;
              M433,309Q414,378,353.5,418Q293,458,221,440Q149,422,114,361Q79,300,113,238Q147,176,213,142Q279,108,346,131Q413,154,439,227Q465,300,433,309Z;
              M412,304Q412,358,371,397Q330,436,265,438Q200,440,151,395Q102,350,113,283Q124,216,170,176Q216,136,282,130Q348,124,388,176Q428,228,420,266Q412,304,412,304Z
            "
          />
        </path>
      </svg>

      {/* Subtle grain on top to hide blur banding */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.03] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
