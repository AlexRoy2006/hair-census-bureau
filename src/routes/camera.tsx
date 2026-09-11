import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, Camera, Upload, RefreshCw, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/census/SiteHeader";
import { CameraFrame } from "@/components/census/CameraFrame";
import { CensusButton } from "@/components/census/CensusButton";
import { MetaStrip } from "@/components/census/MetaStrip";
import { SiteFooter } from "@/components/census/SiteFooter";
import { processCapturedImage } from "@/services/imageProcessor";
import {
  setCapturedImage,
  getCapturedImage,
  clearCapturedImage,
} from "@/services/hairAnalysis";

export const Route = createFileRoute("/camera")({
  head: () => ({
    meta: [
      { title: "Census Capture — MUDI UNDO?" },
      {
        name: "description",
        content:
          "Census protocol MU-01: position your head inside the designated area and capture an image for hair population analysis.",
      },
      { property: "og:title", content: "Census Capture — MUDI UNDO?" },
      {
        property: "og:description",
        content: "Position your head inside the designated area to begin the hair census.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CameraPage,
});

const CHECKS = ["GOOD LIGHTING", "FACE THE CAMERA", "REMOVE OBSTRUCTIONS"];

type CameraState = "initializing" | "active" | "denied" | "unavailable" | "unsupported" | "off";

function CameraPage() {
  const [captured, setCaptured] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("initializing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Stop camera tracks safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize browser camera stream
  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState("unsupported");
      setErrorMessage("Camera access is not supported by your browser. You can upload an image instead.");
      return;
    }

    setCameraState("initializing");
    setErrorMessage(null);
    stopCamera();

    let stream: MediaStream | null = null;
    let frontFacing = true;

    try {
      // 1. Try front-facing camera on mobile / selfie mode
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
    } catch (err1) {
      console.warn("Front camera unavailable, attempting default camera fallback:", err1);
      try {
        // 2. Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        frontFacing = false;
      } catch (err2: any) {
        console.error("Camera acquisition error:", err2);
        const errName = err2?.name || "";
        if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
          setCameraState("denied");
          setErrorMessage("Camera access permission was denied. You can upload an image instead.");
        } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
          setCameraState("unavailable");
          setErrorMessage("No camera device was found on your system. You can upload an image instead.");
        } else if (errName === "NotReadableError" || errName === "TrackStartError") {
          setCameraState("unavailable");
          setErrorMessage("Camera is currently in use by another application. You can upload an image instead.");
        } else {
          setCameraState("unavailable");
          setErrorMessage("Camera access is required for live census analysis. You can upload an image instead.");
        }
        return;
      }
    }

    if (stream) {
      streamRef.current = stream;
      setIsFrontCamera(frontFacing);
      setCameraState("active");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [stopCamera]);

  // Handle mounting and checking existing captured image
  useEffect(() => {
    const existing = getCapturedImage();
    if (existing && typeof existing === "object" && "dataUrl" in existing) {
      setPreviewUrl(existing.dataUrl);
      setCaptured(true);
      setCameraState("off");
    } else {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Keep videoRef connected when camera becomes active
  useEffect(() => {
    if (cameraState === "active" && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [cameraState]);

  // Capture video frame onto canvas
  const handleCapture = async () => {
    if (!videoRef.current || cameraState !== "active") return;

    try {
      const processed = await processCapturedImage(videoRef.current);
      stopCamera();
      setCapturedImage(processed);
      setPreviewUrl(processed.dataUrl);
      setCaptured(true);
      setCameraState("off");
    } catch (err) {
      console.error("Frame capture error:", err);
    }
  };

  // Restart camera for retake
  const handleRetake = () => {
    clearCapturedImage();
    setPreviewUrl(null);
    setCaptured(false);
    startCamera();
  };

  // Upload fallback image selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      stopCamera();
      const processed = await processCapturedImage(file);
      setCapturedImage(processed);
      setPreviewUrl(processed.dataUrl);
      setCaptured(true);
      setCameraState("off");
    } catch (err) {
      console.error("File upload processing error:", err);
    }
  };

  // Navigate to analysis flow
  const handleAnalyze = () => {
    stopCamera();
    navigate({ to: "/analysis" });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader context="CENSUS PROTOCOL MU-01" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="label-tech flex items-center justify-between">
          <span>STEP {captured ? "02" : "01"} OF 03</span>
          <span>{captured ? "PREVIEW" : "ACQUISITION"}</span>
        </div>

        <h1 className="wordmark mt-3 text-3xl sm:text-4xl">
          {captured ? "IMAGE ACQUIRED" : "POSITION YOUR HEAD"}
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-foreground/80">
          {captured
            ? "Review the acquired frame before submitting it to the census engine."
            : "Place your head inside the designated area."}
        </p>

        {/* Camera or preview viewport frame */}
        <div className="mt-6">
          <CameraFrame
            captured={captured}
            videoRef={videoRef}
            previewUrl={previewUrl}
            isCameraActive={cameraState === "active"}
            isFrontCamera={isFrontCamera}
          />
        </div>

        {/* Permissions & Errors Notification Banner */}
        {cameraState !== "active" && cameraState !== "off" && !captured && (
          <div className="mt-4 border border-destructive/40 bg-paper p-4 text-left">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="label-tech font-semibold text-destructive">
                {cameraState === "denied"
                  ? "CAMERA PERMISSION DENIED"
                  : cameraState === "unsupported"
                  ? "BROWSER UNSUPPORTED"
                  : "CAMERA ACCESS UNAVAILABLE"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {errorMessage || "Camera access is required for live census analysis. You can upload an image instead."}
            </p>
          </div>
        )}

        {captured ? (
          <div key="preview" className="animate-rise mt-6">
            <div className="grid grid-cols-2 gap-px border border-border bg-border">
              <div className="bg-paper px-3.5 py-3">
                <div className="label-tech">CENSUS SUBJECT</div>
                <div className="label-tech-ink mt-1.5">ANONYMOUS</div>
              </div>
              <div className="bg-paper px-3.5 py-3">
                <div className="label-tech">IMAGE QUALITY</div>
                <div className="label-tech-ink mt-1.5">GOOD</div>
              </div>
              <div className="bg-paper px-3.5 py-3">
                <div className="label-tech">HEAD DETECTION</div>
                <div className="label-tech-ink mt-1.5">READY</div>
              </div>
              <div className="bg-paper px-3.5 py-3">
                <div className="label-tech">ANALYSIS REGION</div>
                <div className="label-tech-ink mt-1.5">01</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <CensusButton variant="outline" size="lg" onClick={handleRetake}>
                RETAKE
              </CensusButton>
              <CensusButton size="lg" onClick={handleAnalyze}>
                ANALYZE <ArrowRight className="h-3.5 w-3.5" />
              </CensusButton>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <ul className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
              {CHECKS.map((check) => (
                <li key={check} className="flex items-center gap-2 bg-paper px-3.5 py-3">
                  <span className="h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden />
                  <span className="label-tech-ink">{check}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {cameraState === "active" ? (
                <CensusButton size="lg" onClick={handleCapture}>
                  <Camera className="h-3.5 w-3.5" /> CAPTURE IMAGE
                </CensusButton>
              ) : (
                <CensusButton size="lg" variant="outline" onClick={startCamera}>
                  <RefreshCw className="h-3.5 w-3.5" /> RETRY CAMERA
                </CensusButton>
              )}

              <CensusButton
                variant="outline"
                size="lg"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> UPLOAD IMAGE
              </CensusButton>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="hairline-t mt-6 flex items-center justify-between pt-3">
              <span className="label-tech">IMAGE QUALITY</span>
              <span className="label-tech-ink">
                {cameraState === "active" ? "READY" : "AWAITING INPUT"}
              </span>
            </div>
          </div>
        )}

        <MetaStrip className="mt-8" />

        <div className="mt-6">
          <Link
            to="/"
            onClick={stopCamera}
            className="label-tech underline-offset-4 hover:underline"
          >
            ← EXIT CENSUS
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
