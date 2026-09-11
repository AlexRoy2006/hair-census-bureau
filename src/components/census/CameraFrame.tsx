import * as React from "react";
import { cn } from "@/lib/utils";
import { ScanVisualization } from "./ScanVisualization";

export function CameraFrame({
  captured = false,
  scanning = false,
  className,
  videoRef,
  previewUrl,
  isCameraActive = false,
  isFrontCamera = true,
  deviceLabel,
}: {
  captured?: boolean;
  scanning?: boolean;
  className?: string;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  previewUrl?: string | null;
  isCameraActive?: boolean;
  isFrontCamera?: boolean;
  deviceLabel?: string;
}) {
  const sensorText = deviceLabel
    ? deviceLabel
    : isFrontCamera
      ? "FRONT SENSOR"
      : "REAR SENSOR";

  return (
    <div className={cn("relative", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-secondary/60 p-1.5">
        <div className="relative overflow-hidden rounded-xl border border-border">
          <ScanVisualization
            scanning={scanning}
            videoRef={videoRef}
            previewUrl={previewUrl}
            isCameraActive={isCameraActive}
            isFrontCamera={isFrontCamera}
          />

          {/* viewport HUD */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  captured
                    ? "bg-primary"
                    : isCameraActive
                      ? "animate-blip bg-destructive"
                      : "bg-muted-foreground",
                )}
              />
              <span className="label-tech-ink">
                {captured ? "FRAME HELD" : isCameraActive ? "LIVE FEED" : "STANDBY"}
              </span>
            </div>
            <div className="label-tech absolute top-2.5 right-3">
              {captured ? "STILL 01" : isCameraActive ? "30 FPS" : "READY"}
            </div>
            <div className="label-tech absolute bottom-2.5 left-3">EXP 1/120</div>
            <div className="label-tech absolute right-3 bottom-2.5">ISO 400</div>
          </div>

          {captured && (
            <div className="pointer-events-none absolute inset-0 bg-foreground/4 mix-blend-multiply" />
          )}
        </div>
      </div>
      <div className="label-tech mt-2 flex items-center justify-between">
        <span>CAPTURE DEVICE: {sensorText}</span>
        <span>REGION 01</span>
      </div>
    </div>
  );
}
