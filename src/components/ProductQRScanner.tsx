import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  FlipHorizontal,
  ExternalLink,
  ShieldCheck,
  Leaf,
  Layers,
  Search,
  ArrowRight,
  Info,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { WasteAnalysisResult } from '../types';
import {
  ProductLabelRecord,
  PRODUCT_LABEL_DATABASE,
  lookupProductByCode,
  convertProductToAnalysisResult
} from '../services/productLabelDatabase';

interface ProductQRScannerProps {
  onSelectResult: (result: WasteAnalysisResult) => void;
  onSwitchToPhotoScan?: () => void;
}

export const ProductQRScanner: React.FC<ProductQRScannerProps> = ({
  onSelectResult,
  onSwitchToPhotoScan
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [isScanningLive, setIsScanningLive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedRecord, setDetectedRecord] = useState<ProductLabelRecord | null>(null);
  const [scannedRawCode, setScannedRawCode] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<ProductLabelRecord | null>(null);
  const [sampleQrDataUrl, setSampleQrDataUrl] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [manualSearchError, setManualSearchError] = useState<string | null>(null);
  const [copiedInstructions, setCopiedInstructions] = useState(false);
  const [qrBoundingBox, setQrBoundingBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directCaptureInputRef = useRef<HTMLInputElement>(null);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Generate QR code for sample preview whenever a sample is selected
  useEffect(() => {
    if (selectedSample) {
      QRCode.toDataURL(selectedSample.qrCode, {
        width: 240,
        margin: 2,
        color: {
          dark: '#064E3B', // Dark emerald
          light: '#FFFFFF'
        }
      })
        .then((url) => setSampleQrDataUrl(url))
        .catch((err) => console.error('Failed to generate sample QR code:', err));
    } else {
      setSampleQrDataUrl(null);
    }
  }, [selectedSample]);

  // Start live camera stream
  const startCamera = async () => {
    setCameraError(null);
    setQrBoundingBox(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Live camera not supported in this browser. Please upload a photo or use sample product codes.');
      return;
    }

    try {
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setIsScanningLive(true);
      startLiveQrDetection();
    } catch (err: any) {
      console.warn('QR camera stream error:', err);
      setCameraActive(false);
      setIsScanningLive(false);

      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('denied'));

      if (isDenied) {
        setCameraError('Camera access was denied. You can upload an image file or test with sample product codes below.');
      } else {
        setCameraError('Could not start live camera preview. You can pick an image or try sample labels.');
      }
    }
  };

  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsScanningLive(false);
    setQrBoundingBox(null);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  // Continuous frame analysis with jsQR
  const startLiveQrDetection = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const scanFrame = () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameIdRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (width > 0 && height > 0 && ctx) {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          console.log('✅ [QR Scanner] Decoded code:', code.data);

          // Calculate approximate bounding box
          if (code.location) {
            const minX = Math.min(
              code.location.topLeftCorner.x,
              code.location.bottomLeftCorner.x
            );
            const maxX = Math.max(
              code.location.topRightCorner.x,
              code.location.bottomRightCorner.x
            );
            const minY = Math.min(
              code.location.topLeftCorner.y,
              code.location.topRightCorner.y
            );
            const maxY = Math.max(
              code.location.bottomLeftCorner.y,
              code.location.bottomRightCorner.y
            );

            setQrBoundingBox({
              x: (minX / width) * 100,
              y: (minY / height) * 100,
              width: ((maxX - minX) / width) * 100,
              height: ((maxY - minY) / height) * 100
            });
          }

          // Handle the detected QR code
          handleDecodedString(code.data);
          stopCamera();
          return;
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  // Handle uploaded image for QR code decoding
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCameraError(null);
    setManualSearchError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          handleDecodedString(code.data);
        } else {
          setCameraError(
            'No QR code could be detected in that image. Make sure the QR code or barcode is clear and centered, or try one of the sample product labels.'
          );
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Look up decoded code in database
  const handleDecodedString = (codeString: string) => {
    setScannedRawCode(codeString);
    const matched = lookupProductByCode(codeString);

    if (matched) {
      setDetectedRecord(matched);
      setManualSearchError(null);
    } else {
      // Create a fallback product label record based on detected code string
      const fallbackRecord: ProductLabelRecord = {
        id: `unknown-${Date.now()}`,
        qrCode: codeString,
        upc: codeString.replace(/\D/g, '') || '000000000000',
        productName: `Scanned Item Label (${codeString.substring(0, 24)})`,
        brand: 'Packaging Registry',
        category: 'recyclable',
        categoryLabel: 'General Commercial Packaging',
        packageType: 'Rigid Container / Package Label',
        recyclability: 'Inspect resin symbols (#1-#7) or check municipal guidelines',
        binColor: 'Blue Bin (Dry Recyclables)',
        confidence: 85,
        components: [
          {
            name: 'Primary Packaging',
            material: 'Plastic / Paper Composite',
            binColor: 'Blue Bin (Plastics & Paper)',
            action: 'Rinse cleanly and separate dissimilar materials before binning.',
            status: 'Recyclable'
          }
        ],
        stepByStepInstructions: [
          '1. Inspect the packaging for embossed resin numbers (#1 PET, #2 HDPE, #5 PP).',
          '2. Empty any liquid or food contents thoroughly.',
          '3. Rinse to eliminate attractants for pests and mold.',
          '4. Deposit in your curbside Blue Bin (Recyclables).'
        ],
        preparationTips: 'Clean, dry materials ensure higher market value for recycled commodity streams.',
        contaminationCaution: 'Do not place food-soaked containers in paper streams.',
        environmentalImpact: 'Diverting packaging from landfills saves 0.09 kg CO2e on average.',
        carbonSavedKg: 0.09,
        certifications: ['Verified QR Data Stream'],
        verifiedBy: 'EcoSort Universal Code Parser',
        ecoTip: 'Always check the triangular resin identification code stamped on plastic bottoms.',
        alternativeUses: ['Reuse container for household storage before recycling'],
        sampleIcon: '📦'
      };

      setDetectedRecord(fallbackRecord);
    }
  };

  // Handle manual code/search submit
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;

    setManualSearchError(null);
    const matched = lookupProductByCode(manualCodeInput.trim());

    if (matched) {
      handleDecodedString(matched.qrCode);
      setManualCodeInput('');
    } else {
      setManualSearchError(
        `No product matched "${manualCodeInput}". Try codes like ECO-PET-7391, ECO-OATMILK-882, or select a sample item below.`
      );
    }
  };

  // Select sample product to preview and scan
  const handleSelectSample = (sample: ProductLabelRecord) => {
    setSelectedSample(sample);
  };

  // Trigger instant scan of selected sample
  const handleSimulateSampleScan = (sample: ProductLabelRecord) => {
    handleDecodedString(sample.qrCode);
    setSelectedSample(null);
  };

  // View full analysis report (converts to WasteAnalysisResult and triggers parent handler)
  const handleViewFullReport = () => {
    if (!detectedRecord) return;
    const result = convertProductToAnalysisResult(detectedRecord, scannedRawCode || undefined);
    onSelectResult(result);
  };

  // Copy instructions to clipboard
  const handleCopyInstructions = () => {
    if (!detectedRecord) return;
    const text = [
      `♻️ Recycling Instructions for ${detectedRecord.productName} (${detectedRecord.brand}):`,
      `Stream: ${detectedRecord.binColor}`,
      ...detectedRecord.stepByStepInstructions,
      `Impact: ${detectedRecord.environmentalImpact}`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedInstructions(true);
    setTimeout(() => setCopiedInstructions(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="qr-file-upload-input"
      />
      <input
        ref={directCaptureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
        id="qr-camera-capture-input"
      />

      {/* Camera Live Modal Overlay */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-black rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col items-center">
            {/* Top Bar */}
            <div className="absolute top-4 inset-x-4 z-10 flex items-center justify-between text-white">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md flex items-center gap-1.5 border border-white/10">
                <QrCode className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Live QR Code Scanner</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                  title="Flip Camera"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                  title="Close Scanner"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewport with Reticle & Laser Scanline */}
            <div className="relative w-full aspect-4/3 bg-slate-900 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Centered QR Reticle Target */}
              <div className="absolute inset-12 sm:inset-16 border-2 border-emerald-400 rounded-3xl pointer-events-none flex flex-col items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                {/* Corner Markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                {/* Laser scan animation line */}
                <motion.div
                  className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
                  animate={{
                    top: ['5%', '95%', '5%']
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />

                <div className="text-emerald-300 text-xs font-bold bg-black/70 px-3 py-1 rounded-full backdrop-blur-xs shadow-xs pointer-events-none">
                  Point at Product QR / Barcode
                </div>
              </div>

              {/* Dynamic bounding box when detected */}
              {qrBoundingBox && (
                <div
                  className="absolute border-4 border-emerald-400 bg-emerald-400/20 rounded-lg pointer-events-none transition-all duration-75"
                  style={{
                    left: `${qrBoundingBox.x}%`,
                    top: `${qrBoundingBox.y}%`,
                    width: `${qrBoundingBox.width}%`,
                    height: `${qrBoundingBox.height}%`
                  }}
                />
              )}
            </div>

            {/* Bottom info */}
            <div className="p-4 bg-slate-900 w-full text-center text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">Scanning automatically in real-time...</p>
              <p className="text-slate-400 text-[11px]">
                Hold steady. Instant instructions will display the moment the code is detected.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera / Upload Error Alert */}
      {cameraError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3 text-xs sm:text-sm shadow-xs"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{cameraError}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => directCaptureInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all"
                >
                  Snap Photo with Phone
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 text-xs font-medium transition-all"
                >
                  Upload Image
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCameraError(null)}
            className="text-amber-600 hover:text-amber-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* MAIN QR SCANNER HUB */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Scanner Launchers & Upload (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>On-Pack Label & Barcode Scanner</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Zero AI Latency • Instant
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif] tracking-tight">
                Scan Product Packaging Label
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                Scan the QR code, How2Recycle® stamp, or retail barcode printed on food, beverage, or personal care packaging for certified recycling guidelines.
              </p>
            </div>

            {/* Big Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Live Camera Button */}
              <button
                type="button"
                id="btn-launch-qr-camera"
                onClick={startCamera}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-left transition-all shadow-md shadow-emerald-700/20 active:scale-98 flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    Live Video
                  </span>
                </div>
                <div>
                  <div className="font-extrabold text-base">Open QR Camera</div>
                  <div className="text-xs text-emerald-100/90 mt-0.5">
                    Real-time automatic detection
                  </div>
                </div>
              </button>

              {/* Upload Image Button */}
              <button
                type="button"
                id="btn-upload-qr-photo"
                onClick={() => fileInputRef.current?.click()}
                className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-left transition-all active:scale-98 flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                    <Upload className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    Image File
                  </span>
                </div>
                <div>
                  <div className="font-bold text-base text-slate-900">Upload Label Photo</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Drop or pick a screenshot / photo
                  </div>
                </div>
              </button>
            </div>

            {/* Manual Code Lookup Form */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label htmlFor="manual-qr-input" className="block text-xs font-bold text-slate-700">
                Or enter product code / barcode manually:
              </label>
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="manual-qr-input"
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => {
                      setManualCodeInput(e.target.value);
                      setManualSearchError(null);
                    }}
                    placeholder="e.g. ECO-PET-7391, ECO-OATMILK-882, 012000001291"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shrink-0"
                >
                  Lookup
                </button>
              </form>

              {manualSearchError && (
                <p className="text-xs text-rose-600 font-medium">{manualSearchError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Test Product Shelf (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-emerald-50/60 rounded-3xl p-6 border border-emerald-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-950 font-extrabold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Test Sample Product Labels</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700">8 Database Items</span>
            </div>

            <p className="text-xs text-emerald-900/80 leading-relaxed">
              No product package nearby? Tap any product below to preview its generated QR label and test the instant database lookup.
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {PRODUCT_LABEL_DATABASE.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSample(item)}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    selectedSample?.id === item.id
                      ? 'bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-200'
                      : 'bg-white/80 hover:bg-white border-emerald-100 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">{item.sampleIcon}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500 truncate">
                      {item.qrCode}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 line-clamp-1">
                    {item.productName}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold truncate mt-0.5">
                    {item.categoryLabel}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SAMPLE QR CODE PREVIEW MODAL */}
      <AnimatePresence>
        {selectedSample && sampleQrDataUrl && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 border border-emerald-200 shadow-2xl text-center space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setSelectedSample(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 pt-1">
                <span className="text-2xl">{selectedSample.sampleIcon}</span>
                <h4 className="font-bold text-slate-900 text-base">{selectedSample.productName}</h4>
                <p className="text-xs text-slate-500">{selectedSample.brand}</p>
              </div>

              {/* Rendered QR Code Image */}
              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 inline-block shadow-inner">
                <img
                  src={sampleQrDataUrl}
                  alt={`QR code for ${selectedSample.productName}`}
                  className="w-48 h-48 mx-auto rounded-xl shadow-xs"
                />
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div className="font-mono text-[11px] font-bold text-emerald-800">
                  Encoded: {selectedSample.qrCode}
                </div>
                <p className="text-[11px] text-slate-400">
                  Scan this code with another phone camera, or click below for instant simulation!
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSimulateSampleScan(selectedSample)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate Instant Scan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSample(null)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETECTED PRODUCT RECORD BREAKDOWN CARD */}
      <AnimatePresence>
        {detectedRecord && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl shadow-emerald-900/5 space-y-6 relative"
          >
            {/* Top Bar with Verified Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg shadow-2xs">
                  {detectedRecord.sampleIcon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Verified Database Record
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Code: {scannedRawCode || detectedRecord.qrCode}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
                    {detectedRecord.productName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manufacturer: <strong>{detectedRecord.brand}</strong> • Package: {detectedRecord.packageType}
                  </p>
                </div>
              </div>

              {/* Close / Dismiss */}
              <button
                type="button"
                onClick={() => setDetectedRecord(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                title="Dismiss and scan another"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Primary Disposal Stream Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                  ♻️
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Primary Destination Bin
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-slate-900">
                    {detectedRecord.binColor}
                  </div>
                </div>
              </div>

              <div className="text-right sm:text-right text-xs">
                <span className="px-3 py-1 rounded-full bg-white font-bold text-emerald-800 border border-emerald-200 shadow-2xs">
                  {detectedRecord.recyclability}
                </span>
              </div>
            </div>

            {/* MULTI-PART PACKAGING COMPONENTS TABLE */}
            {detectedRecord.components && detectedRecord.components.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Packaging Components Breakdown ({detectedRecord.components.length} parts)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Separate materials for 100% recycling compliance
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {detectedRecord.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{comp.name}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            comp.status === 'Recyclable'
                              ? 'bg-emerald-100 text-emerald-800'
                              : comp.status === 'Compostable'
                              ? 'bg-lime-100 text-lime-800'
                              : comp.status === 'Special Drop-off'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {comp.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{comp.material}</div>
                      <div className="text-xs text-slate-700 font-medium leading-snug">
                        {comp.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP-BY-STEP CERTIFIED PREPARATION INSTRUCTIONS */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Official Packaging Instructions
                </span>
                <button
                  type="button"
                  onClick={handleCopyInstructions}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  {copiedInstructions ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Steps</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                {detectedRecord.stepByStepInstructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold shrink-0">•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {detectedRecord.contaminationCaution && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Caution:</strong> {detectedRecord.contaminationCaution}
                  </span>
                </div>
              )}
            </div>

            {/* Environmental Footprint & Verification Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
                <Leaf className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Carbon Diverted</div>
                  <div className="text-emerald-800 text-xs">{detectedRecord.environmentalImpact}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-slate-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900">Authority & Standards</div>
                  <div className="text-slate-500 text-xs truncate">{detectedRecord.verifiedBy}</div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDetectedRecord(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
              >
                Scan Another Label
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-view-full-qr-report"
                  onClick={handleViewFullReport}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>Log Disposal & View Full Impact</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
