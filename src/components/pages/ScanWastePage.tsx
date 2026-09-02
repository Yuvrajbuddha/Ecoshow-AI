import React, { useState, useRef, useEffect } from 'react';
import { WasteAnalysisResult } from '../../types';
import { aiService } from '../../services/apiClient';
import { SAMPLE_WASTE_ITEMS } from '../../services/sampleData';
import { optimizeImageForAI } from '../../lib/imageOptimizer';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Lightbulb, 
  Image as ImageIcon,
  X,
  FlipHorizontal,
  Flame,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScanWastePageProps {
  onAnalysisComplete: (result: WasteAnalysisResult) => void;
  isDemoMode: boolean;
}

export const ScanWastePage: React.FC<ScanWastePageProps> = ({
  onAnalysisComplete,
  isDemoMode,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [userHint, setUserHint] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Analysis steps configuration
  const steps = [
    { title: 'Detecting object & geometry...', icon: '🔍' },
    { title: 'Identifying material composition...', icon: '🧬' },
    { title: 'Checking waste category & streams...', icon: '♻️' },
    { title: 'Preparing localized disposal guidance...', icon: '🌱' },
  ];

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid JPG, PNG, or WEBP image.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisStep(0);
      // Downscale large smartphone photos down to crisp ~1024px JPEGs (typically ~100KB)
      const optimized = await optimizeImageForAI(file, 1024, 0.85);
      setSelectedImage(optimized.dataUrl);
      setSelectedMimeType(optimized.mimeType);
      runAnalysis(optimized.dataUrl, optimized.mimeType, undefined, userHint);
    } catch (err: any) {
      setIsAnalyzing(false);
      console.warn('Image optimization fallback:', err);
      // Fallback: read directly if canvas resize encounters any issue
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setSelectedMimeType(file.type);
        runAnalysis(base64, file.type, undefined, userHint);
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read image. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Camera handling with progressive fallbacks & permission detection
  const startCamera = async () => {
    setErrorMessage(null);
    setCameraBlocked(false);

    // If mediaDevices is unavailable (e.g. non-HTTPS, restricted iframe), trigger native capture directly
    if (!navigator?.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia is not supported or accessible in this context. Launching native camera capture.');
      cameraCaptureInputRef.current?.click();
      return;
    }

    try {
      if (streamRef.current) {
        stopCamera();
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (constraintErr: any) {
        // If facingMode or resolution constraint fails, try basic video
        if (
          constraintErr?.name === 'OverconstrainedError' ||
          constraintErr?.name === 'ConstraintNotSatisfiedError'
        ) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw constraintErr;
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn('Video autoplay notice:', err));
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access unavailable:', err);
      setCameraActive(false);

      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        (typeof err?.message === 'string' &&
          (err.message.toLowerCase().includes('permission') ||
            err.message.toLowerCase().includes('denied')));

      if (isPermissionDenied) {
        setCameraBlocked(true);
        setErrorMessage(
          'Camera access was denied or is blocked by browser/iframe security. You can snap a photo with your device camera directly, upload a file, or open the app in a new tab.'
        );
        // Automatically open the device photo picker / camera capture input so the user can proceed seamlessly
        setTimeout(() => {
          cameraCaptureInputRef.current?.click();
        }, 120);
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setErrorMessage(
          'No camera was detected on this device. Please select or drop an image file.'
        );
      } else {
        setErrorMessage(
          'Could not start live camera preview. Opening device camera / photo selector instead.'
        );
        setTimeout(() => {
          cameraCaptureInputRef.current?.click();
        }, 120);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    // Stop camera stream cleanly
    stopCamera();
    
    try {
      setIsAnalyzing(true);
      const optimized = await optimizeImageForAI(rawDataUrl, 1024, 0.85);
      setSelectedImage(optimized.dataUrl);
      setSelectedMimeType(optimized.mimeType);
      runAnalysis(optimized.dataUrl, optimized.mimeType, undefined, userHint);
    } catch (err) {
      setSelectedImage(rawDataUrl);
      setSelectedMimeType('image/jpeg');
      runAnalysis(rawDataUrl, 'image/jpeg', undefined, userHint);
    }
  };

  // Run analysis workflow
  const runAnalysis = async (
    imageBase64: string,
    mimeType: string,
    sampleKey?: string,
    hintText?: string
  ) => {
    setIsAnalyzing(true);
    setSelectedImage(imageBase64);
    setAnalysisStep(0);
    setErrorMessage(null);

    // Step simulation timers for rich user feedback
    const interval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 550);

    try {
      const activeHint = hintText !== undefined ? hintText : userHint;
      const response = await aiService.analyzeWaste(
        imageBase64,
        mimeType,
        activeHint ? activeHint.trim() : undefined,
        sampleKey
      );

      clearInterval(interval);
      setAnalysisStep(steps.length);

      // Short delay so user sees final checkmark
      setTimeout(() => {
        setIsAnalyzing(false);
        onAnalysisComplete(response.result);
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      console.warn('Analysis error:', err);
      setErrorMessage(
        err?.message || "EcoSort AI couldn't analyze this image right now. Please verify your connection or try another photo."
      );
    }
  };

  const handleSampleClick = (sampleKey: string) => {
    const sample = SAMPLE_WASTE_ITEMS[sampleKey];
    if (sample) {
      // Create a clean placeholder canvas image for the sample
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ECFDF5';
        ctx.fillRect(0, 0, 400, 300);
        ctx.fillStyle = '#065F46';
        ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sample.detectedItem, 200, 150);
        ctx.font = '14px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = '#059669';
        ctx.fillText(sample.categoryLabel, 200, 180);
      }
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelectedImage(dataUrl);
      runAnalysis(dataUrl, 'image/jpeg', sampleKey, sample.detectedItem);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multimodal Waste Scanner</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-['Space_Grotesk',sans-serif]">
          What are you throwing away?
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
          Upload a photo or take a picture of the item you want to identify for instant disposal guidance.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm shadow-xs"
        >
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-medium text-amber-950 leading-snug">{errorMessage}</p>
              {cameraBlocked && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => cameraCaptureInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Snap / Pick Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 text-xs font-semibold transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-700" />
                    <span>Upload Image File</span>
                  </button>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-amber-800 hover:text-amber-950 underline font-medium"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setErrorMessage(null);
              setCameraBlocked(false);
            }}
            className="text-amber-600 hover:text-amber-800 self-start sm:self-center p-1 rounded-lg hover:bg-amber-100 transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Camera Stream Overlay Modal */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-black rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col items-center">
            {/* Header Controls */}
            <div className="absolute top-4 inset-x-4 z-10 flex items-center justify-between text-white">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md">
                Live Waste Camera
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                  title="Flip Camera"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>
                <button
                  onClick={stopCamera}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                  title="Close Camera"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Viewport with AI Scan Reticle */}
            <div className="relative w-full aspect-4/3 bg-slate-900 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Overlay Grid */}
              <div className="absolute inset-8 border-2 border-emerald-400/70 border-dashed rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="text-emerald-300 text-xs font-bold bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                  Center Item in Frame
                </div>
              </div>
            </div>

            {/* Shutter Button */}
            <div className="p-6 bg-slate-900 w-full flex items-center justify-center">
              <button
                id="camera-shutter-btn"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-400 active:scale-90 transition-transform shadow-lg shadow-emerald-500/30 flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-white/20" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload / Analysis Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            /* ANIMATED MULTI-STEP ANALYSIS SCREEN WITH PHOTO SCANNER */
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-emerald-200/80 shadow-xl shadow-emerald-950/5 text-center space-y-6"
            >
              {/* Photo Preview with Laser Scanner */}
              {selectedImage && (
                <div className="relative max-w-xs sm:max-w-sm mx-auto aspect-4/3 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md bg-slate-900">
                  <img
                    src={selectedImage}
                    alt="Waste Item to Analyze"
                    className="w-full h-full object-cover"
                  />
                  {/* Glowing Laser Scanline */}
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981]"
                    animate={{
                      top: ['0%', '100%', '0%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  {/* Grid Reticle Overlay */}
                  <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
                    <span>AI Vision Active</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Space_Grotesk',sans-serif]">
                  Analyzing item in photo...
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Multimodal vision model inspecting shape, material texture, and stream classification
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto bg-slate-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                  initial={{ width: '10%' }}
                  animate={{
                    width: `${((analysisStep + 1) / steps.length) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Animated Checklist Steps */}
              <div className="max-w-md mx-auto space-y-2.5 text-left">
                {steps.map((step, idx) => {
                  const isDone = idx < analysisStep;
                  const isCurrent = idx === analysisStep;
                  return (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        isDone
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                          : isCurrent
                          ? 'bg-white border-emerald-400 text-slate-900 shadow-xs ring-2 ring-emerald-100'
                          : 'bg-slate-50 border-slate-200/60 text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="text-base">{step.icon}</span>
                      <span className="text-xs sm:text-sm font-semibold flex-1">
                        {step.title}
                      </span>
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAnalyzing(false);
                    setSelectedImage(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Cancel and choose another photo
                </button>
              </div>
            </motion.div>
          ) : (
            /* UPLOAD DROP ZONE */
            <motion.div
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center transition-all bg-white shadow-sm ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-100 scale-[1.01]'
                  : 'border-slate-300/80 hover:border-emerald-400 hover:bg-emerald-50/10'
              }`}
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-input"
              />

              {/* Hidden direct camera capture input */}
              <input
                ref={cameraCaptureInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="camera-capture-input"
              />

              <div className="max-w-md mx-auto space-y-6">
                {/* Big Camera Icon Badge */}
                <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Camera className="w-10 h-10" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Space_Grotesk',sans-serif]">
                    Drop your waste image here
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Drag and drop your photo, or choose an action below
                  </p>
                </div>

                {/* Optional Hint Input */}
                <div className="pt-1 max-w-sm mx-auto">
                  <input
                    type="text"
                    id="input-user-hint"
                    value={userHint}
                    onChange={(e) => setUserHint(e.target.value)}
                    placeholder="Optional item hint (e.g. wood plank, AA battery, glass bottle)"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden text-slate-800 placeholder-slate-400 text-center transition-all shadow-2xs"
                  />
                </div>

                {/* Buttons: Take a Photo & Upload Image */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <button
                    id="btn-take-photo"
                    onClick={startCamera}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take a Photo</span>
                  </button>

                  <span className="text-xs text-slate-400 font-medium">or</span>

                  <button
                    id="btn-upload-image"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold text-sm border border-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Upload Image</span>
                  </button>
                </div>

                {/* Formats info */}
                <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                  <span>Supported formats:</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px]">
                    JPG
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px]">
                    PNG
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px]">
                    WEBP
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Test Samples Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Try Common Sample Items
          </span>
          <span className="text-xs text-slate-400">Click to test instant analysis</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'plastic_bottle', name: 'Plastic Bottle', icon: '🧴', label: 'PET #1' },
            { id: 'banana_peel', name: 'Banana Peel', icon: '🍌', label: 'Organic' },
            { id: 'mobile_charger', name: 'Mobile Charger', icon: '🔌', label: 'E-Waste' },
            { id: 'aluminum_can', name: 'Soda Can', icon: '🥫', label: 'Recycle' },
            { id: 'used_battery', name: 'AA Battery', icon: '🔋', label: 'Hazardous' },
            { id: 'pizza_box', name: 'Pizza Box', icon: '🍕', label: 'Grease' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleSampleClick(item.id)}
              className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all group"
            >
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="font-bold text-xs text-slate-800 group-hover:text-emerald-800">
                {item.name}
              </div>
              <div className="text-[10px] text-slate-400">{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* QUICK TIPS CARD */}
      <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200/80 p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
          <Lightbulb className="w-4 h-4 text-emerald-700" />
          <span>Quick Tips for Best AI Recognition</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-700">
          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              <strong>Take a clear photo:</strong> Ensure sharp focus on the object.
            </span>
          </div>
          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              <strong>Include whole item:</strong> Avoid cropping out bottle caps or labels.
            </span>
          </div>
          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              <strong>Avoid blurry images:</strong> Hold steady in well-lit surroundings.
            </span>
          </div>
          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              <strong>Show recycling symbols:</strong> Resin stamp (#1, #2, #5) aids detection.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
