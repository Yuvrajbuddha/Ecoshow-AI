import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { WasteAnalysisResult } from '../../types';
import { aiService } from '../../services/AIService';
import { SAMPLE_WASTE_ITEMS } from '../../services/sampleData';
import { optimizeImageForAI } from '../../lib/imageOptimizer';
import { ProductQRScanner } from '../ProductQRScanner';
import {
  lookupProductByCode,
  convertProductToAnalysisResult
} from '../../services/productLabelDatabase';
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
  ExternalLink,
  QrCode,
  FileText,
  Type,
  Send,
  FileCheck,
  FileSpreadsheet,
  FileUp,
  FileCode,
  Check,
  Mic,
  MicOff,
  Radio,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScanWastePageProps {
  onAnalysisComplete: (result: WasteAnalysisResult) => void;
  isDemoMode: boolean;
}

export type InputMode = 'image' | 'text' | 'document';

// Sample pre-configured documents for instant multimodal testing
const SAMPLE_DOCUMENTS = [
  {
    id: 'packaging_spec',
    title: 'Packaging Barrier Film Spec (PDF)',
    type: 'Specification Sheet',
    sizeText: '42 KB',
    description: 'Technical spec for composite snack food pouch (BOPP, Aluminium foil, LDPE).',
    content: `TECHNICAL PACKAGING SPECIFICATION SHEET
Document ID: SPEC-PKG-2024-081
Material Structure: Multi-layer Flexible Barrier Pouch
Layer 1 (External): 20 micron Biaxially Oriented Polypropylene (BOPP #5)
Layer 2 (Barrier): 9 micron Metallized Aluminium Vacuum Deposition Foil
Layer 3 (Sealant): 45 micron Low-Density Polyethylene (LDPE #4)
Lamination: Solventless polyurethane adhesive system
Recyclability Evaluation: Not recyclable in standard municipal curbside recycling streams due to bonded metallized foil layer.
Disposal Recommendation: Non-recyclable composite packaging. Dispose in General Waste (Grey/Black bin) or designated energy-from-waste collection. Do not contaminate clean plastic streams.`
  },
  {
    id: 'battery_sds',
    title: 'Lithium Battery Safety Data Sheet (PDF)',
    type: 'Safety Data Sheet (MSDS)',
    sizeText: '118 KB',
    description: 'Hazardous material disposal protocol for 3.7V lithium-ion polymer cell.',
    content: `SAFETY DATA SHEET (SDS) - Section 13: Waste Disposal
Product: Rechargeable Lithium-Ion Polymer Battery (Li-Po 3.7V 3500mAh)
Regulation: UN 3480 / Dangerous Goods Class 9 (Miscellaneous Hazards)
Component Breakdown: Cobalt oxide lithium, graphite carbon, organic carbonate electrolyte (dimethyl carbonate / ethylene carbonate), copper anode, aluminium cathode.
Hazard Statement: Flammable electrolyte, fire or chemical burn hazard upon mechanical puncture or thermal overload.
Disposal Protocol: Prohibited from curbside trash and standard commingled recycling bins. Cover battery terminal contacts with insulating vinyl tape. Hand over exclusively to certified municipal hazardous waste depots, e-waste drop-off bins, or participating electronics retail take-back programs.`
  },
  {
    id: 'compostable_cert',
    title: 'Compostable Bioplastic Certificate (PDF)',
    type: 'Compliance Certificate',
    sizeText: '65 KB',
    description: 'EN 13432 & ASTM D6400 certification for PLA produce bags.',
    content: `CERTIFICATE OF COMPOSTABILITY & MATERIAL SPECIFICATION
Certificate No: BIO-CERT-9942-EU
Product: 100% Industrially Compostable Produce & Grocery Bag
Standard Compliance: EN 13432, ASTM D6400, Seedling Certified (7P0421)
Base Resin: Polylactic Acid (PLA) synthesized from fermented plant starch (corn/sugar cane) compounded with PBAT biopolymer.
Biodegradation Profile: 90% organic disintegration into water, CO2, and biomass within 90 days under controlled industrial composting conditions (>55°C).
Disposal Instructions: Deposit in municipal Organics / Food Waste (Green Bin) or industrial composting facility. Note: Do NOT place in curbside PET/HDPE recycling bins as PLA will cross-contaminate and degrade mechanical recycling batches.`
  }
];

// Preset prompt chips for "Enter Text"
const SAMPLE_TEXT_PROMPTS = [
  'Cracked ceramic coffee mug with glazed enamel finish',
  'Greasy pizza delivery carton with cheese and sauce residue',
  'Swollen 3.7V rechargeable lithium phone battery',
  'Polystyrene EPS foam protective packaging blocks',
  'Half-empty paint can with residual solvent-based oil enamel',
  'Empty clear 500ml PET sparkling water bottle with label and cap'
];

export const ScanWastePage: React.FC<ScanWastePageProps> = ({
  onAnalysisComplete,
  isDemoMode,
}) => {
  // Input modality state: 'image' | 'text' | 'document'
  const [inputMode, setInputMode] = useState<InputMode>('image');
  const [scanMethod, setScanMethod] = useState<'photo' | 'qr'>('photo');

  // Image mode states
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraBlocked, setCameraBlocked] = useState(false);

  // Text mode states
  const [textContent, setTextContent] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [interimVoiceText, setInterimVoiceText] = useState('');
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [voiceSuccessMessage, setVoiceSuccessMessage] = useState<string | null>(null);

  // Audio / Speech refs
  const speechRecognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioMeterAnimationRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Document mode states
  const [selectedDocFile, setSelectedDocFile] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
    excerpt?: string;
  } | null>(null);
  const [docDragging, setDocDragging] = useState(false);

  // General analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<InputMode>('image');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userHint, setUserHint] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Dynamic analysis steps depending on modality
  const getStepsForMode = (mode: InputMode) => {
    switch (mode) {
      case 'text':
        return [
          { title: 'Parsing waste description & terminology...', icon: '📝' },
          { title: 'Identifying material components & contaminants...', icon: '🧬' },
          { title: 'Checking municipal waste category & bin stream...', icon: '♻️' },
          { title: 'Generating disposal guide & sustainability tip...', icon: '🌱' },
        ];
      case 'document':
        return [
          { title: 'Extracting document text & material specifications...', icon: '📄' },
          { title: 'Analyzing MSDS hazard codes & recyclability profile...', icon: '🔬' },
          { title: 'Evaluating regulatory disposal requirements...', icon: '⚖️' },
          { title: 'Synthesizing certified disposal guidelines...', icon: '🌱' },
        ];
      case 'image':
      default:
        return [
          { title: 'Detecting object & geometry in image...', icon: '🔍' },
          { title: 'Identifying material composition & textures...', icon: '🧬' },
          { title: 'Checking waste category & streams...', icon: '♻️' },
          { title: 'Preparing localized disposal guidance...', icon: '🌱' },
        ];
    }
  };

  const steps = getStepsForMode(activeAnalysisMode);

  // Stop camera and voice recording on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopVoiceRecording(false);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // IMAGE HANDLING
  // ─────────────────────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = async (file: File) => {
    setErrorMessage(null);

    if (!file || file.size <= 0) {
      setErrorMessage('Cannot process image: The selected file is empty (0 bytes). Please upload a valid image.');
      return;
    }

    const isImage = file.type.toLowerCase().startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|bmp|gif)$/i.test(file.name);
    if (!isImage) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WEBP, or HEIC).');
      return;
    }

    try {
      setIsAnalyzing(true);
      setActiveAnalysisMode('image');
      setAnalysisStep(0);

      const optimized = await optimizeImageForAI(file, 1024, 0.85);
      const optBase64 = optimized.base64.replace(/\s+/g, '');
      const optByteSize = Math.round((optBase64.length * 3) / 4);
      if (!optBase64 || optByteSize <= 0) {
        throw new Error('Image optimization resulted in empty data (0 bytes).');
      }

      // Quick QR code detection check
      try {
        const testImg = new Image();
        testImg.src = optimized.dataUrl;
        await new Promise((res) => { testImg.onload = res; testImg.onerror = res; });
        if (testImg.width > 0 && testImg.height > 0) {
          const testCanvas = document.createElement('canvas');
          testCanvas.width = testImg.width;
          testCanvas.height = testImg.height;
          const testCtx = testCanvas.getContext('2d');
          if (testCtx) {
            testCtx.drawImage(testImg, 0, 0);
            const imgData = testCtx.getImageData(0, 0, testImg.width, testImg.height);
            const detectedQr = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth'
            });
            if (detectedQr && detectedQr.data) {
              const matchedProd = lookupProductByCode(detectedQr.data);
              if (matchedProd) {
                console.log('✅ QR Code detected in uploaded image matching product:', matchedProd.productName);
                setIsAnalyzing(false);
                const result = convertProductToAnalysisResult(matchedProd, detectedQr.data);
                onAnalysisComplete(result);
                return;
              }
            }
          }
        }
      } catch (qrErr) {
        console.warn('QR check in uploaded image bypassed:', qrErr);
      }

      setSelectedImage(optimized.dataUrl);
      setSelectedMimeType(optimized.mimeType);
      runImageAnalysis(optimized.dataUrl, optimized.mimeType, undefined, userHint);
    } catch (err: any) {
      setIsAnalyzing(false);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).replace(/\s+/g, '');
        if (!base64) {
          setErrorMessage('Failed to read image data. Please try another photo.');
          return;
        }
        setSelectedImage(base64);
        setSelectedMimeType(file.type || 'image/jpeg');
        runImageAnalysis(base64, file.type || 'image/jpeg', undefined, userHint);
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
      processImageFile(file);
    }
  };

  // Camera handling
  const startCamera = async () => {
    setErrorMessage(null);
    setCameraBlocked(false);

    if (!navigator?.mediaDevices?.getUserMedia) {
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
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
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
      setCameraBlocked(true);
      setErrorMessage('Camera access was denied or unavailable. Opening device camera / photo selector instead.');
      setTimeout(() => {
        cameraCaptureInputRef.current?.click();
      }, 120);
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
    
    if (video.videoWidth <= 0 || video.videoHeight <= 0 || video.readyState < 2) {
      setErrorMessage('Camera preview is still preparing frames. Please wait a second and press the shutter again.');
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    stopCamera();
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    try {
      setIsAnalyzing(true);
      setActiveAnalysisMode('image');
      const optimized = await optimizeImageForAI(rawDataUrl, 1024, 0.88);
      setSelectedImage(optimized.dataUrl);
      setSelectedMimeType(optimized.mimeType);
      runImageAnalysis(optimized.dataUrl, optimized.mimeType, undefined, userHint);
    } catch (err) {
      setSelectedImage(rawDataUrl);
      setSelectedMimeType('image/jpeg');
      runImageAnalysis(rawDataUrl, 'image/jpeg', undefined, userHint);
    }
  };

  const runImageAnalysis = async (
    imageBase64: string,
    mimeType: string,
    sampleKey?: string,
    hintText?: string
  ) => {
    setErrorMessage(null);
    setIsAnalyzing(true);
    setActiveAnalysisMode('image');
    setSelectedImage(imageBase64);
    setAnalysisStep(0);

    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 550);

    try {
      const activeHint = hintText !== undefined ? hintText : userHint;
      const response = await aiService.analyzeWaste(
        imageBase64,
        mimeType,
        activeHint ? activeHint.trim() : undefined,
        sampleKey,
        { inputType: 'image' }
      );

      clearInterval(interval);
      setAnalysisStep(4);

      setTimeout(() => {
        setIsAnalyzing(false);
        onAnalysisComplete(response.result);
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setErrorMessage(
        err?.message || "EcoSort AI couldn't analyze this image right now. Please check connection and try again."
      );
    }
  };

  const handleSampleClick = (sampleKey: string) => {
    const sample = SAMPLE_WASTE_ITEMS[sampleKey];
    if (sample) {
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
      runImageAnalysis(dataUrl, 'image/jpeg', sampleKey, sample.detectedItem);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VOICE-TO-TEXT & AUDIO RECORDING HANDLING
  // ─────────────────────────────────────────────────────────────────────────
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const stopAudioTracks = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (audioMeterAnimationRef.current) {
      cancelAnimationFrame(audioMeterAnimationRef.current);
      audioMeterAnimationRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setVoiceVolume(0);
  };

  const startVoiceRecording = async () => {
    setMicPermissionError(null);
    setVoiceSuccessMessage(null);
    setInterimVoiceText('');
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicPermissionError('Microphone recording is not supported in this browser environment. Please type your description.');
      return;
    }

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      // 2. Setup audio analyser for live sound wave visualizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (!audioStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            setVoiceVolume(normalized);
            audioMeterAnimationRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }
      } catch (audioCtxErr) {
        console.warn('AudioContext meter setup skipped:', audioCtxErr);
      }

      // 3. Start seconds timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // 4. Start Web Speech recognition if supported
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          speechRecognitionRef.current = recognition;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                final += transcript + ' ';
              } else {
                interim += transcript;
              }
            }

            if (interim) {
              setInterimVoiceText(interim);
            }

            if (final) {
              setTextContent((prev) => {
                const cleanPrev = prev.trim();
                const cleanFinal = final.trim();
                return cleanPrev ? `${cleanPrev} ${cleanFinal}` : cleanFinal;
              });
              setInterimVoiceText('');
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('SpeechRecognition error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              setMicPermissionError('Microphone permission denied. Please allow microphone access in your browser address bar.');
            }
          };

          recognition.start();
        } catch (recogErr) {
          console.warn('SpeechRecognition initialization note:', recogErr);
        }
      }

      // 5. Setup MediaRecorder as backup recording
      try {
        const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
        let supportedMime = '';
        for (const m of mimeTypes) {
          if (MediaRecorder.isTypeSupported(m)) {
            supportedMime = m;
            break;
          }
        }
        const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(250);
      } catch (recErr) {
        console.warn('MediaRecorder setup note:', recErr);
      }

      setIsRecordingVoice(true);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      stopAudioTracks();
      setIsRecordingVoice(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setMicPermissionError('Microphone access was denied. Please allow microphone access in your browser settings to use voice input.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setMicPermissionError('No microphone was detected on this device. Please connect a microphone and try again.');
      } else {
        setMicPermissionError(`Could not access microphone (${err?.message || 'Error'}).`);
      }
    }
  };

  const stopVoiceRecording = async (saveText = true) => {
    setIsRecordingVoice(false);

    // Stop speech recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    // Stop MediaRecorder and extract blob
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    let audioBlob: Blob | null = null;

    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const mime = recorder.mimeType || 'audio/webm';
            audioBlob = new Blob(audioChunksRef.current, { type: mime });
          }
          resolve();
        };
        try {
          recorder.stop();
        } catch {
          resolve();
        }
      });
    }

    // Stop hardware audio tracks
    stopAudioTracks();

    if (!saveText) {
      setInterimVoiceText('');
      return;
    }

    // If interim text was captured, append to text content
    if (interimVoiceText.trim()) {
      setTextContent((prev) => {
        const cleanPrev = prev.trim();
        const cleanInterim = interimVoiceText.trim();
        return cleanPrev ? `${cleanPrev} ${cleanInterim}` : cleanInterim;
      });
      setInterimVoiceText('');
      setVoiceSuccessMessage('Voice recorded and converted to text!');
      setTimeout(() => setVoiceSuccessMessage(null), 4000);
      return;
    }

    // If textContent was already populated by SpeechRecognition
    if (textContent.trim()) {
      setVoiceSuccessMessage('Voice recorded and converted to text!');
      setTimeout(() => setVoiceSuccessMessage(null), 4000);
      return;
    }

    // If textContent is still empty, transcribe recorded audio chunks with server-side AI model
    if (audioBlob && (audioBlob as Blob).size > 1000) {
      setIsTranscribingVoice(true);
      try {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          const mime = (audioBlob as Blob).type || 'audio/webm';
          const result = await aiService.transcribeAudio(base64Data, mime);
          setIsTranscribingVoice(false);
          if (result.text && result.text.trim()) {
            setTextContent((prev) => {
              const cleanPrev = prev.trim();
              const cleanNew = result.text.trim();
              return cleanPrev ? `${cleanPrev} ${cleanNew}` : cleanNew;
            });
            setVoiceSuccessMessage('Voice transcribed with AI!');
            setTimeout(() => setVoiceSuccessMessage(null), 4000);
          } else {
            setMicPermissionError('No speech was detected in the audio recording. Please try speaking closer to your microphone.');
          }
        };
      } catch (transcribeErr) {
        setIsTranscribingVoice(false);
        console.warn('Audio transcribe error:', transcribeErr);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // TEXT MODE HANDLING
  // ─────────────────────────────────────────────────────────────────────────
  const handleTextAnalysisSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = textContent.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a description of the waste item to classify.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setActiveAnalysisMode('text');
    setSelectedImage(null);
    setAnalysisStep(0);

    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 500);

    try {
      const response = await aiService.analyzeText(trimmed, userHint.trim() || undefined);
      clearInterval(interval);
      setAnalysisStep(4);

      setTimeout(() => {
        setIsAnalyzing(false);
        onAnalysisComplete(response.result);
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setErrorMessage(err?.message || 'Failed to analyze text description. Please try again.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENT MODE HANDLING
  // ─────────────────────────────────────────────────────────────────────────
  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      processDocFile(file);
    }
  };

  const processDocFile = (file: File) => {
    setErrorMessage(null);
    if (!file || file.size <= 0) {
      setErrorMessage('The selected document is empty (0 bytes). Please upload a valid document.');
      return;
    }

    const isPdfOrText = 
      file.type.includes('pdf') || 
      file.type.includes('text') || 
      /\.(pdf|txt|md|doc|docx|json)$/i.test(file.name);

    if (!isPdfOrText) {
      setErrorMessage('Please upload a PDF document (.pdf) or text specification file (.txt, .md, .doc).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedDocFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        base64: dataUrl,
        excerpt: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDocAnalysisSubmit = async () => {
    if (!selectedDocFile) {
      setErrorMessage('Please select or upload a document first.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setActiveAnalysisMode('document');
    setSelectedImage(null);
    setAnalysisStep(0);

    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 550);

    try {
      const response = await aiService.analyzeDocument(
        selectedDocFile.base64,
        selectedDocFile.name,
        selectedDocFile.type,
        selectedDocFile.excerpt,
        userHint.trim() || undefined
      );

      clearInterval(interval);
      setAnalysisStep(4);

      setTimeout(() => {
        setIsAnalyzing(false);
        onAnalysisComplete(response.result);
      }, 400);
    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setErrorMessage(err?.message || 'Failed to extract and analyze waste document. Please try again.');
    }
  };

  const handleSampleDocClick = (sample: typeof SAMPLE_DOCUMENTS[0]) => {
    // Encode sample document text as a base64 data URI to simulate authentic PDF / doc upload
    const base64DataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(sample.content)))}`;
    setSelectedDocFile({
      name: `${sample.title}.pdf`,
      size: sample.content.length,
      type: 'application/pdf',
      base64: base64DataUrl,
      excerpt: sample.content.slice(0, 320),
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multimodal EcoSort AI</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17211D] tracking-[-0.04em]">
          What are you throwing away?
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
          Choose your input method below to get instant waste category, bin recommendation, recyclability, and certified disposal instructions.
        </p>

        {/* PRIMARY MULTIMODAL MODE SELECTOR: Upload Image | Enter Text | Upload Document */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-inner max-w-full overflow-x-auto">
            <button
              type="button"
              id="tab-upload-image"
              onClick={() => {
                if (isRecordingVoice) stopVoiceRecording(false);
                setInputMode('image');
                setErrorMessage(null);
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                inputMode === 'image'
                  ? 'bg-white text-emerald-950 shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Upload Image</span>
            </button>

            <button
              type="button"
              id="tab-enter-text"
              onClick={() => {
                setInputMode('text');
                setErrorMessage(null);
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                inputMode === 'text'
                  ? 'bg-white text-emerald-950 shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-4 h-4 text-emerald-600" />
              <span>Enter Text / Voice</span>
              {isRecordingVoice && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              id="tab-upload-document"
              onClick={() => {
                if (isRecordingVoice) stopVoiceRecording(false);
                setInputMode('document');
                setErrorMessage(null);
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                inputMode === 'document'
                  ? 'bg-white text-emerald-950 shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
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
              {cameraBlocked && inputMode === 'image' && (
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

            <div className="relative w-full aspect-4/3 bg-slate-900 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-8 border-2 border-emerald-400/70 border-dashed rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="text-emerald-300 text-xs font-bold bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                  Center Item in Frame
                </div>
              </div>
            </div>

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

      {/* Main Analysis Screen / Input Container */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            /* ANIMATED MULTI-STEP ANALYSIS SCREEN */
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-emerald-200/80 shadow-xl shadow-emerald-950/5 text-center space-y-6"
            >
              {/* Context Preview according to active modality */}
              {activeAnalysisMode === 'image' && selectedImage && (
                <div className="relative max-w-xs sm:max-w-sm mx-auto aspect-4/3 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md bg-slate-900">
                  <img
                    src={selectedImage}
                    alt="Waste Item to Analyze"
                    className="w-full h-full object-cover"
                  />
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981]"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
                    <span>Vision AI Active</span>
                  </div>
                </div>
              )}

              {activeAnalysisMode === 'text' && (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5" />
                      Analyzing Text Description
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 text-[10px]">
                      NLP Classifier
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium italic line-clamp-3 bg-white p-3 rounded-xl border border-emerald-100">
                    "{textContent}"
                  </p>
                </div>
              )}

              {activeAnalysisMode === 'document' && selectedDocFile && (
                <div className="max-w-md mx-auto p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-800">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Parsing Document
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-200/70 text-blue-900 text-[10px]">
                      PDF Extract
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-blue-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-xs">
                      PDF
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{selectedDocFile.name}</p>
                      <p className="text-[11px] text-slate-500">{Math.round(selectedDocFile.size / 1024)} KB • Spec Document</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Space_Grotesk',sans-serif]">
                  {activeAnalysisMode === 'image' && 'Analyzing item in photo...'}
                  {activeAnalysisMode === 'text' && 'Understanding waste description...'}
                  {activeAnalysisMode === 'document' && 'Extracting waste specifications...'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {activeAnalysisMode === 'image' && 'Multimodal vision model inspecting shape, material texture, and stream classification'}
                  {activeAnalysisMode === 'text' && 'Semantic language model determining composition, packaging rules, and proper bin stream'}
                  {activeAnalysisMode === 'document' && 'Document understanding engine reviewing safety data sheets and recycling standards'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto bg-slate-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                  initial={{ width: '10%' }}
                  animate={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }}
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
                  Cancel analysis
                </button>
              </div>
            </motion.div>
          ) : (
            /* ACTIVE INPUT PANELS */
            <div className="space-y-6">
              {/* ─────────────────────────────────────────────────────────────
                  MODE 1: UPLOAD IMAGE
                 ───────────────────────────────────────────────────────────── */}
              {inputMode === 'image' && (
                <>
                  {scanMethod === 'qr' ? (
                    <ProductQRScanner
                      onSelectResult={onAnalysisComplete}
                      onSwitchToPhotoScan={() => setScanMethod('photo')}
                    />
                  ) : (
                    <>
                      {/* Banner Prompting QR Scanner for Packaged Goods */}
                      <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 text-emerald-950">
                          <QrCode className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>
                            Have a product packaging barcode or QR code? Use the <strong>Product Label QR Scanner</strong> for certified manufacturer instructions.
                          </span>
                        </div>
                        <button
                          type="button"
                          id="btn-switch-to-qr-banner"
                          onClick={() => setScanMethod('qr')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 transition-all shadow-xs active:scale-95"
                        >
                          Switch to QR Scanner
                        </button>
                      </div>

                      {/* Drop Zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center transition-all bg-white shadow-sm ${
                          isDragging
                            ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-100 scale-[1.01]'
                            : 'border-slate-300/80 hover:border-emerald-400 hover:bg-emerald-50/10'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload-input"
                        />
                        <input
                          ref={cameraCaptureInputRef}
                          type="file"
                          accept="image/*,.jpg,.jpeg,.png,.webp"
                          capture="environment"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="camera-capture-input"
                        />

                        <div className="max-w-md mx-auto space-y-6">
                          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shadow-xs">
                            <Camera className="w-10 h-10" />
                          </div>

                          <div className="space-y-1.5">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Space_Grotesk',sans-serif]">
                              Drop your waste image here
                            </h3>
                            <p className="text-slate-500 text-sm">
                              Drag & drop a waste photo, snap with your camera, or select a file
                            </p>
                          </div>

                          {/* Optional Hint */}
                          <div className="pt-1 max-w-sm mx-auto">
                            <input
                              type="text"
                              id="input-user-hint-image"
                              value={userHint}
                              onChange={(e) => setUserHint(e.target.value)}
                              placeholder="Optional item hint (e.g. wood plank, battery, sauce bottle)"
                              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden text-slate-800 placeholder-slate-400 text-center transition-all shadow-2xs"
                            />
                          </div>

                          {/* Action Buttons */}
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

                          <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
                            <span>Supported formats:</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px]">JPG</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px]">PNG</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px]">WEBP</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Test Samples */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            Try Common Sample Items
                          </span>
                          <span className="text-xs text-slate-400">Click for instant analysis</span>
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
                    </>
                  )}
                </>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  MODE 2: ENTER TEXT / VOICE DICTATION
                 ───────────────────────────────────────────────────────────── */}
              {inputMode === 'text' && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Type className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-['Space_Grotesk',sans-serif]">
                          Describe Your Waste Item
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Type or speak into your microphone to describe what you are throwing away
                        </p>
                      </div>
                    </div>

                    {/* Primary Voice-to-Text Toggle Button */}
                    <div className="flex items-center gap-2">
                      {!isRecordingVoice ? (
                        <button
                          type="button"
                          id="btn-start-voice-recording"
                          onClick={startVoiceRecording}
                          disabled={isTranscribingVoice}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                          title="Record description using microphone"
                        >
                          {isTranscribingVoice ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                              <span>Transcribing Voice...</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4 text-emerald-700" />
                              <span>Record with Mic</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          id="btn-stop-voice-recording"
                          onClick={() => stopVoiceRecording(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all active:scale-95 animate-pulse"
                        >
                          <MicOff className="w-4 h-4" />
                          <span>Stop Recording ({formatSeconds(recordingSeconds)})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Voice Recording Panel */}
                  <AnimatePresence>
                    {isRecordingVoice && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border border-emerald-200 shadow-inner space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="relative flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                              </span>
                              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                                Microphone Active • {formatSeconds(recordingSeconds)}
                              </span>
                            </div>

                            {/* Sound Wave Frequency Visualizer */}
                            <div className="flex items-center gap-1 h-5 px-3 py-1 bg-white/80 rounded-full border border-emerald-200/60 shadow-2xs">
                              <Radio className="w-3 h-3 text-emerald-600 mr-1 animate-pulse" />
                              {[35, 70, 100, 55, 85, 45, 75].map((baseHeight, idx) => {
                                const dynamicHeight = Math.max(
                                  18,
                                  Math.min(100, Math.round(baseHeight * (0.3 + (voiceVolume / 100) * 0.7)))
                                );
                                return (
                                  <span
                                    key={idx}
                                    className="w-1 bg-emerald-600 rounded-full transition-all duration-75"
                                    style={{ height: `${dynamicHeight}%` }}
                                  />
                                );
                              })}
                            </div>

                            {/* Actions while recording */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                id="btn-voice-done"
                                onClick={() => stopVoiceRecording(true)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Done</span>
                              </button>
                              <button
                                type="button"
                                id="btn-voice-cancel"
                                onClick={() => stopVoiceRecording(false)}
                                className="px-2.5 py-1.5 rounded-lg bg-white/80 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-all"
                                title="Cancel recording without saving"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>

                          {/* Live Speech Recognition Transcript Preview */}
                          <div className="text-xs bg-white/95 p-3 rounded-xl border border-emerald-100/90 text-slate-700">
                            {interimVoiceText ? (
                              <span className="text-emerald-950 font-medium">
                                "{interimVoiceText}" <span className="animate-pulse text-emerald-600 font-bold">|</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">
                                🎙️ Listening... Speak naturally to describe the waste item, packaging, or material.
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Transcribing Spinner Banner */}
                  {isTranscribingVoice && (
                    <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700 shrink-0" />
                      <span>Transcribing recorded voice into description...</span>
                    </div>
                  )}

                  {/* Success Message Banner */}
                  {voiceSuccessMessage && (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{voiceSuccessMessage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVoiceSuccessMessage(null)}
                        className="text-emerald-600 hover:text-emerald-900 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Mic Error Banner */}
                  {micPermissionError && (
                    <div className="flex items-start justify-between p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-rose-900">Microphone Notice</span>
                          <span>{micPermissionError}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMicPermissionError(null)}
                        className="text-rose-500 hover:text-rose-800 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleTextAnalysisSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <label htmlFor="input-waste-text" className="font-semibold text-slate-700">
                          Item Description
                        </label>
                        <div className="flex items-center gap-3">
                          {textContent.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setTextContent('')}
                              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              Clear
                            </button>
                          )}
                          <span>{textContent.length} characters</span>
                        </div>
                      </div>

                      {/* Textarea with integrated corner mic button */}
                      <div className="relative">
                        <textarea
                          id="input-waste-text"
                          rows={4}
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          placeholder="e.g., A cracked ceramic coffee mug with blue glaze, an empty cardboard milk carton with a plastic screw cap, or speak using the microphone..."
                          className="w-full text-sm p-4 pr-12 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:outline-hidden text-slate-800 placeholder-slate-400 transition-all shadow-2xs leading-relaxed"
                        />
                        <button
                          type="button"
                          id="btn-textarea-mic"
                          onClick={() => {
                            if (isRecordingVoice) {
                              stopVoiceRecording(true);
                            } else {
                              startVoiceRecording();
                            }
                          }}
                          disabled={isTranscribingVoice}
                          title={isRecordingVoice ? 'Stop voice recording' : 'Click to speak with microphone'}
                          className={`absolute right-3 bottom-3 p-2 rounded-xl border transition-all ${
                            isRecordingVoice
                              ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md'
                              : 'bg-white text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200 shadow-2xs'
                          }`}
                        >
                          {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Preset Prompt Suggestions */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                        Or click an example description to test:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {SAMPLE_TEXT_PROMPTS.map((promptText, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTextContent(promptText)}
                            className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80 hover:border-emerald-300 text-slate-700 transition-all text-left"
                          >
                            {promptText}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Action */}
                    <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>EcoSort AI will classify the stream, recyclability, and assign the proper bin.</span>
                      </div>
                      <button
                        type="submit"
                        id="btn-analyze-text"
                        disabled={!textContent.trim() || isRecordingVoice || isTranscribingVoice}
                        className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                        <span>Analyze Description</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  MODE 3: UPLOAD DOCUMENT
                 ───────────────────────────────────────────────────────────── */}
              {inputMode === 'document' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-['Space_Grotesk',sans-serif]">
                          Upload Waste Document or Spec Sheet
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Upload packaging spec sheets, Safety Data Sheets (SDS/MSDS), or recycling certificates (PDF, TXT, DOC)
                        </p>
                      </div>
                    </div>

                    <input
                      ref={docFileInputRef}
                      type="file"
                      accept=".pdf,.txt,.doc,.docx,.md,.json,application/pdf,text/plain"
                      onChange={handleDocFileSelect}
                      className="hidden"
                      id="doc-upload-input"
                    />

                    {/* Document Drop / Preview Zone */}
                    {selectedDocFile ? (
                      <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                              PDF
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-blue-950 truncate">
                                {selectedDocFile.name}
                              </h4>
                              <p className="text-xs text-blue-700">
                                {Math.round(selectedDocFile.size / 1024)} KB • Ready for extraction
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedDocFile(null)}
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-blue-100 transition-colors"
                            title="Remove document"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {selectedDocFile.excerpt && (
                          <div className="p-3 bg-white rounded-xl border border-blue-100 text-xs text-slate-700 font-mono line-clamp-3 leading-relaxed">
                            {selectedDocFile.excerpt}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => docFileInputRef.current?.click()}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-900 text-xs font-semibold"
                          >
                            Choose Different File
                          </button>
                          <button
                            type="button"
                            id="btn-analyze-document"
                            onClick={handleDocAnalysisSubmit}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Analyze Waste Document</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => docFileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDocDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDocDragging(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDocDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) processDocFile(file);
                        }}
                        className={`rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all bg-white ${
                          docDragging
                            ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-100'
                            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/20'
                        }`}
                      >
                        <div className="max-w-sm mx-auto space-y-3">
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                            <FileUp className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-900">
                              Drop your waste document or PDF here
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Supports PDF, TXT, DOC, or specification sheets up to 25MB
                            </p>
                          </div>
                          <button
                            type="button"
                            id="btn-browse-docs"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Browse Document File</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sample Documents for 1-Click Multimodal Testing */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-blue-600" />
                        Test with Sample Waste Documents
                      </span>
                      <span className="text-xs text-slate-400">One-click instant document loading</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {SAMPLE_DOCUMENTS.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => handleSampleDocClick(doc)}
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all space-y-1.5 text-left group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                              {doc.type}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">{doc.sizeText}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-900 leading-snug">
                            {doc.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {doc.description}
                          </p>
                          <div className="pt-1 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                            <span>Load Document</span>
                            <span>→</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* QUICK TIPS CARD */}
      <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200/80 p-5 space-y-3">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
          <Lightbulb className="w-4 h-4 text-emerald-700" />
          <span>Multimodal AI Recognition Best Practices</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              <strong>Photos:</strong> Capture clear lighting, showing labels, caps, and material resin symbols (#1 - #7).
            </span>
          </div>
          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              <strong>Text Descriptions:</strong> Mention contaminants (e.g. food grease, oil residue) and components.
            </span>
          </div>
          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              <strong>Documents & PDFs:</strong> Upload technical data sheets or SDS Section 13 for industrial compliance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
