import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Stylised technical head-scan instrument with optional live video or preview overlay.
 */
export function ScanVisualization({
  scanning = false,
  labels = true,
  className,
  videoRef,
  previewUrl,
  isCameraActive = false,
  isFrontCamera = true,
}: {
  scanning?: boolean;
  labels?: boolean;
  className?: string;
  videoRef?: React.RefObject<HTMLVideoElement | null> | undefined;
  previewUrl?: string | null | undefined;
  isCameraActive?: boolean;
  isFrontCamera?: boolean;
}) {
  const hasMedia = Boolean(isCameraActive || previewUrl);

  return (
    <div className={cn("relative aspect-4/5 w-full overflow-hidden bg-paper", className)}>
      <div className="grid-paper absolute inset-0 opacity-60" aria-hidden />

      {/* Live Video Feed */}
      {isCameraActive && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            isFrontCamera && "-scale-x-100",
          )}
        />
      )}

      {/* Preview Image */}
      {previewUrl && !isCameraActive && (
        <img
          src={previewUrl}
          alt="Acquired head scan preview"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
        />
      )}

      <svg
        viewBox="0 0 320 400"
        className="absolute inset-0 h-full w-full pointer-events-none"
        role="img"
        aria-label="Technical head scan visualisation"
      >
        {/* coordinate frame */}
        <g stroke="var(--color-hairline)" strokeWidth="1" opacity={hasMedia ? "0.6" : "0.9"}>
          <line x1="24" y1="24" x2="24" y2="376" />
          <line x1="296" y1="24" x2="296" y2="376" />
          <line x1="24" y1="24" x2="296" y2="24" />
          <line x1="24" y1="376" x2="296" y2="376" />
        </g>

        {/* corner brackets */}
        <g stroke="var(--color-primary)" strokeWidth="1.6" fill="none">
          <path d="M24 46 V24 H46" />
          <path d="M274 24 H296 V46" />
          <path d="M296 354 V376 H274" />
          <path d="M46 376 H24 V354" />
        </g>

        {/* measurement ticks */}
        <g stroke="var(--color-hairline)" strokeWidth="1" opacity={hasMedia ? "0.5" : "1"}>
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`ty${i}`} x1="24" y1={40 + i * 19} x2={i % 3 === 0 ? 36 : 30} y2={40 + i * 19} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`tx${i}`} x1={40 + i * 19} y1="376" x2={40 + i * 19} y2={i % 3 === 0 ? 364 : 370} />
          ))}
        </g>

        {/* crosshair */}
        <g stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 5">
          <line x1="160" y1="24" x2="160" y2="376" />
          <line x1="24" y1="196" x2="296" y2="196" />
        </g>

        {/* head silhouette */}
        <g
          fill="var(--color-accent)"
          fillOpacity={hasMedia ? "0.2" : "0.55"}
          stroke="var(--color-primary)"
          strokeWidth="1.6"
        >
          <path d="M160 74 C207 74 236 110 236 156 C236 186 228 204 220 218 C214 229 212 240 213 252 C214 264 208 272 195 276 L195 300 C195 316 182 328 166 328 L154 328 C138 328 125 316 125 300 L125 276 C112 272 106 264 107 252 C108 240 106 229 100 218 C92 204 84 186 84 156 C84 110 113 74 160 74 Z" />
        </g>

        {/* scalp density mesh */}
        <g stroke="var(--color-primary)" strokeWidth="0.7" opacity={hasMedia ? "0.35" : "0.55"} fill="none">
          <path d="M92 150 C120 108 200 108 228 150" />
          <path d="M88 168 C118 124 202 124 232 168" />
          <path d="M96 132 C124 98 196 98 224 132" />
          <line x1="120" y1="100" x2="120" y2="200" />
          <line x1="160" y1="88" x2="160" y2="210" />
          <line x1="200" y1="100" x2="200" y2="200" />
        </g>

        {/* follicle sample points */}
        <g fill="var(--color-primary)" opacity={hasMedia ? "0.6" : "1"}>
          {[
            [128, 122],
            [160, 112],
            [192, 122],
            [112, 148],
            [144, 138],
            [176, 138],
            [208, 148],
            [126, 168],
            [160, 160],
            [194, 168],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" />
          ))}
        </g>

        {/* measurement callouts */}
        <g stroke="var(--color-hairline)" strokeWidth="1">
          <line x1="236" y1="156" x2="278" y2="156" />
          <line x1="84" y1="156" x2="42" y2="156" />
          <line x1="160" y1="74" x2="160" y2="46" />
        </g>

        {labels && (
          <g
            fill="var(--color-muted-foreground)"
            fontFamily="var(--font-mono)"
            fontSize="7"
            letterSpacing="1.4"
          >
            <text x="30" y="18">
              REGION 01 / SCALP
            </text>
            <text x="206" y="18">
              GRID 28MM
            </text>
            <text x="242" y="150">
              R-AXIS
            </text>
            <text x="46" y="150">
              L-AXIS
            </text>
            <text x="166" y="44">
              VERTEX
            </text>
            <text x="30" y="392">
              MU-VISION / FOLLICLE-NET
            </text>
            <text x="236" y="392">
              CAL 0.998
            </text>
          </g>
        )}
      </svg>

      {scanning && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="animate-scanline absolute inset-x-0 top-0 h-16 bg-linear-to-b from-transparent via-primary/12 to-primary/40">
            <div className="absolute inset-x-0 bottom-0 h-px bg-primary" />
          </div>
        </div>
      )}
    </div>
  );
}
