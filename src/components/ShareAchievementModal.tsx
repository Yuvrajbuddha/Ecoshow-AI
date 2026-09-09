import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImpactMetrics, AchievementBadge, WasteAnalysisResult } from '../types';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Award, 
  Sparkles, 
  Flame, 
  Recycle, 
  Leaf, 
  Smartphone,
  ShieldCheck,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface ShareAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: ImpactMetrics;
  badges: AchievementBadge[];
  recentScans?: WasteAnalysisResult[];
}

type CardTheme = 'emerald' | 'midnight' | 'solar';

export const ShareAchievementModal: React.FC<ShareAchievementModalProps> = ({
  isOpen,
  onClose,
  metrics,
  badges,
  recentScans = [],
}) => {
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('emerald');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger confetti when opened
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // Fallback gracefully if confetti fails
      }
    }
  }, [isOpen]);

  // Safe rounded rect helper for Canvas
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + width, y, x + width, y + height, radius);
      ctx.arcTo(x + width, y + height, x, y + height, radius);
      ctx.arcTo(x, y + height, x, y, radius);
      ctx.arcTo(x, y, x + width, y, radius);
      ctx.closePath();
    }
  };

  // Generate the snapshot on canvas
  const generateCanvasImage = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1080;
    const h = 1080;

    // Theme backgrounds
    let bgGrad = ctx.createLinearGradient(0, 0, w, h);
    let cardOverlayGrad = ctx.createLinearGradient(0, 0, w, h);
    let accentColor = '#10B981';
    let secondaryAccent = '#34D399';
    let textColor = '#FFFFFF';
    let subTextColor = '#A7F3D0';

    if (selectedTheme === 'emerald') {
      bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#064E3B');
      bgGrad.addColorStop(0.5, '#047857');
      bgGrad.addColorStop(1, '#022C22');

      cardOverlayGrad = ctx.createLinearGradient(60, 60, w - 60, h - 60);
      cardOverlayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      cardOverlayGrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
      accentColor = '#34D399';
      secondaryAccent = '#FBBF24';
      textColor = '#FFFFFF';
      subTextColor = '#D1FAE5';
    } else if (selectedTheme === 'midnight') {
      bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(0.5, '#1E1B4B');
      bgGrad.addColorStop(1, '#020617');

      cardOverlayGrad = ctx.createLinearGradient(60, 60, w - 60, h - 60);
      cardOverlayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      cardOverlayGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      accentColor = '#60A5FA';
      secondaryAccent = '#A855F7';
      textColor = '#FFFFFF';
      subTextColor = '#94A3B8';
    } else if (selectedTheme === 'solar') {
      bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#78350F');
      bgGrad.addColorStop(0.4, '#B45309');
      bgGrad.addColorStop(1, '#064E3B');

      cardOverlayGrad = ctx.createLinearGradient(60, 60, w - 60, h - 60);
      cardOverlayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
      cardOverlayGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      accentColor = '#FBBF24';
      secondaryAccent = '#34D399';
      textColor = '#FFFFFF';
      subTextColor = '#FEF3C7';
    }

    // 1. Fill base gradient
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Decorative background glow circles
    const radGlow1 = ctx.createRadialGradient(240, 200, 20, 240, 200, 450);
    radGlow1.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
    radGlow1.addColorStop(1, 'rgba(52, 211, 153, 0)');
    ctx.fillStyle = radGlow1;
    ctx.beginPath();
    ctx.arc(240, 200, 450, 0, Math.PI * 2);
    ctx.fill();

    const radGlow2 = ctx.createRadialGradient(880, 850, 20, 880, 850, 400);
    radGlow2.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
    radGlow2.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = radGlow2;
    ctx.beginPath();
    ctx.arc(880, 850, 400, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main frosted card
    const cardMargin = 60;
    const cardW = w - cardMargin * 2;
    const cardH = h - cardMargin * 2;

    ctx.save();
    ctx.fillStyle = cardOverlayGrad;
    drawRoundedRect(ctx, cardMargin, cardMargin, cardW, cardH, 44);
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();
    ctx.restore();

    // 3. Header badge & branding
    // Brand pill
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    drawRoundedRect(ctx, cardMargin + 48, cardMargin + 48, 280, 52, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText('🌿 EcoSort AI Impact', cardMargin + 72, cardMargin + 82);
    ctx.restore();

    // Date tag right
    ctx.font = '500 20px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = subTextColor;
    ctx.textAlign = 'right';
    const dateFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    ctx.fillText(`Verified ${dateFormatted}`, w - cardMargin - 48, cardMargin + 82);
    ctx.textAlign = 'left';

    // 4. Headline & Milestone
    ctx.font = '900 68px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText('Sustainability Milestone', cardMargin + 48, cardMargin + 175);

    ctx.font = '500 26px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = subTextColor;
    ctx.fillText('Personal Circular Action & Carbon Avoidance Record', cardMargin + 48, cardMargin + 215);

    // 5. Giant Hero Stat Banner: Total Carbon Saved
    const heroBoxY = cardMargin + 250;
    const heroBoxH = 200;

    ctx.save();
    const heroGrad = ctx.createLinearGradient(cardMargin + 48, heroBoxY, w - cardMargin - 48, heroBoxY + heroBoxH);
    heroGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    heroGrad.addColorStop(1, 'rgba(255, 255, 255, 0.06)');
    ctx.fillStyle = heroGrad;
    drawRoundedRect(ctx, cardMargin + 48, heroBoxY, cardW - 96, heroBoxH, 32);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.stroke();

    // Leaf Icon circle
    ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.beginPath();
    ctx.arc(cardMargin + 130, heroBoxY + 100, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '56px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('🌱', cardMargin + 130, heroBoxY + 118);
    ctx.textAlign = 'left';

    // Hero Text
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = secondaryAccent;
    ctx.fillText('TOTAL CARBON EMISSIONS AVOIDED', cardMargin + 215, heroBoxY + 68);

    ctx.font = '900 82px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${metrics.totalCarbonSavedKg.toFixed(2)} kg`, cardMargin + 215, heroBoxY + 144);

    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = subTextColor;
    const offsetW = ctx.measureText(`${metrics.totalCarbonSavedKg.toFixed(2)} kg`).width;
    ctx.fillText('CO₂e', cardMargin + 225 + offsetW, heroBoxY + 144);
    ctx.restore();

    // 6. Grid of 4 Key Progress Metrics
    const gridY = heroBoxY + heroBoxH + 30;
    const gridH = 155;
    const gridItemW = (cardW - 96 - 45) / 4;

    const stats = [
      {
        label: 'ECO STREAK',
        value: `${metrics.streakDays} Days`,
        sub: 'Consistency',
        icon: '🔥',
        color: '#F59E0B'
      },
      {
        label: 'ITEMS SORTED',
        value: `${metrics.correctlySorted || metrics.itemsScanned}`,
        sub: 'Verified circular',
        icon: '♻️',
        color: '#10B981'
      },
      {
        label: 'ECO SCORE',
        value: `${metrics.ecoScore}%`,
        sub: 'Sorting accuracy',
        icon: '🎯',
        color: '#3B82F6'
      },
      {
        label: 'ECO POINTS',
        value: `${metrics.ecoPoints}`,
        sub: 'Reward tier',
        icon: '🏆',
        color: '#EC4899'
      }
    ];

    stats.forEach((stat, idx) => {
      const itemX = cardMargin + 48 + idx * (gridItemW + 15);
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      drawRoundedRect(ctx, itemX, gridY, gridItemW, gridH, 24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Icon & label
      ctx.font = '28px system-ui';
      ctx.fillText(stat.icon, itemX + 20, gridY + 44);

      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = stat.color;
      ctx.fillText(stat.label, itemX + 60, gridY + 42);

      // Value
      ctx.font = '900 36px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(stat.value, itemX + 20, gridY + 98);

      // Subtitle
      ctx.font = '500 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = subTextColor;
      ctx.fillText(stat.sub, itemX + 20, gridY + 128);
      ctx.restore();
    });

    // 7. Unlocked Achievements Badges Showcase
    const badgesY = gridY + gridH + 30;
    const badgesBoxH = 145;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
    drawRoundedRect(ctx, cardMargin + 48, badgesY, cardW - 96, badgesBoxH, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = accentColor;
    ctx.fillText('TOP UNLOCKED ACHIEVEMENTS', cardMargin + 72, badgesY + 40);

    const unlocked = badges.filter(b => b.unlocked);
    const displayBadges = unlocked.length > 0 ? unlocked.slice(0, 3) : badges.slice(0, 3);

    displayBadges.forEach((b, idx) => {
      const bX = cardMargin + 72 + idx * 280;
      const bY = badgesY + 62;

      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      drawRoundedRect(ctx, bX, bY, 260, 56, 16);
      ctx.fill();

      ctx.font = '26px system-ui';
      ctx.fillText('🏅', bX + 14, bY + 38);

      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(b.title.length > 18 ? b.title.slice(0, 16) + '…' : b.title, bX + 50, bY + 35);
      ctx.restore();
    });
    ctx.restore();

    // 8. Footer Certificate Bar & Security Check
    const footerY = badgesY + badgesBoxH + 28;
    ctx.save();
    ctx.font = '600 18px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = subTextColor;
    ctx.fillText('Certified Circular Action • Verified via Multi-Modal Vision Model', cardMargin + 48, footerY + 20);

    ctx.textAlign = 'right';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('ecosort-ai.app', w - cardMargin - 48, footerY + 20);
    ctx.restore();

    const outputUrl = canvas.toDataURL('image/png', 1.0);
    setDataUrl(outputUrl);
  }, [metrics, badges, selectedTheme]);

  useEffect(() => {
    if (isOpen) {
      generateCanvasImage();
    }
  }, [isOpen, generateCanvasImage, selectedTheme]);

  // Download image to device gallery / folder
  const handleSaveToGallery = () => {
    if (!dataUrl) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.download = `ecosort-achievement-${dateStr}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        throw new Error('ClipboardItem API not supported in this browser');
      }
    } catch (err: any) {
      setShareError('Could not copy image directly. Use "Save Image" to download.');
      setTimeout(() => setShareError(null), 3500);
    }
  };

  // Share via device (Web Share API)
  const handleShareDevice = async () => {
    if (!dataUrl) return;
    setShareError(null);

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'ecosort-achievement.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My EcoSort Sustainability Achievement',
          text: `I have diverted ${metrics.totalCarbonSavedKg.toFixed(2)} kg of CO₂e and sorted ${metrics.correctlySorted || metrics.itemsScanned} items with EcoSort AI! 🌱🔥`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'My EcoSort Sustainability Achievement',
          text: `I have diverted ${metrics.totalCarbonSavedKg.toFixed(2)} kg of CO₂e with an active ${metrics.streakDays}-day eco streak on EcoSort AI! 🌱`,
          url: window.location.href,
        });
      } else {
        // Fallback: save image
        handleSaveToGallery();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setShareError('Sharing not supported on this browser. Image saved to gallery instead!');
        handleSaveToGallery();
        setTimeout(() => setShareError(null), 4000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Share Achievement</h3>
              <p className="text-xs text-slate-500">Save progress card to device gallery or social media</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-share-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
          {/* Theme Palette Switcher */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Palette className="w-3.5 h-3.5 text-emerald-600" />
              <span>Card Theme:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTheme('emerald')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedTheme === 'emerald'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                <span>Emerald Forest</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTheme('midnight')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedTheme === 'midnight'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Midnight</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTheme('solar')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedTheme === 'solar'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                <span>Solar Glow</span>
              </button>
            </div>
          </div>

          {/* Generated Image Preview */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-950 flex items-center justify-center aspect-square">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="Achievement Card Snapshot"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-white text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Generating snapshot image...</span>
              </div>
            )}

            {/* Success badge overlay */}
            <AnimatePresence>
              {isSaved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 p-4 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-base">Saved to Device Gallery!</div>
                  <div className="text-xs text-emerald-200">
                    High-resolution PNG image has been saved to your downloads / photos.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Share error notice if any */}
          {shareError && (
            <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
              <span>ℹ️</span>
              <span>{shareError}</span>
            </div>
          )}

          {/* Key snapshot details highlight */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Carbon Saved</div>
              <div className="font-black text-slate-800 text-sm">{metrics.totalCarbonSavedKg.toFixed(2)} kg</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Active Streak</div>
              <div className="font-black text-amber-600 text-sm">{metrics.streakDays} Days 🔥</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Items Sorted</div>
              <div className="font-black text-emerald-700 text-sm">{metrics.correctlySorted || metrics.itemsScanned} ♻️</div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Save to Local Gallery button */}
          <button
            type="button"
            id="btn-save-image-to-gallery"
            onClick={handleSaveToGallery}
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{isSaved ? 'Saved to Gallery!' : 'Save Image to Gallery'}</span>
          </button>

          {/* Share via Device */}
          <button
            type="button"
            id="btn-share-device-native"
            onClick={handleShareDevice}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>Share</span>
          </button>

          {/* Copy Image */}
          <button
            type="button"
            id="btn-copy-achievement-image"
            onClick={handleCopyImage}
            title="Copy image to clipboard"
            className="w-full sm:w-auto py-3 px-3.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span className="sm:hidden">{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
