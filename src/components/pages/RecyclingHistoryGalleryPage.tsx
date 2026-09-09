import React, { useState, useMemo } from 'react';
import { WasteAnalysisResult, ActiveTab, WasteCategory } from '../../types';
import { getCategoryBadgeClasses } from '../../lib/utils';
import { 
  Camera, 
  Search, 
  Filter, 
  Trash2, 
  Sparkles, 
  ArrowUpRight, 
  Leaf, 
  Recycle, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Eye, 
  ExternalLink, 
  MessageSquare, 
  MapPin, 
  ChevronDown, 
  Download, 
  RotateCcw, 
  Layers, 
  SlidersHorizontal,
  X,
  Maximize2,
  HelpCircle,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecyclingHistoryGalleryPageProps {
  scans: WasteAnalysisResult[];
  onSelectScan: (item: WasteAnalysisResult) => void;
  onDeleteScan: (id: string) => void;
  onClearHistory: () => void;
  onRestoreDefaults: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onAskAIWithItem?: (item: WasteAnalysisResult) => void;
}

export const RecyclingHistoryGalleryPage: React.FC<RecyclingHistoryGalleryPageProps> = ({
  scans,
  onSelectScan,
  onDeleteScan,
  onClearHistory,
  onRestoreDefaults,
  setActiveTab,
  onAskAIWithItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBin, setSelectedBin] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'carbon' | 'confidence'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [inspectedItem, setInspectedItem] = useState<WasteAnalysisResult | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: scans.length,
      recyclable: 0,
      organic: 0,
      ewaste: 0,
      hazardous: 0,
      context_dependent: 0,
      general: 0,
    };
    scans.forEach((s) => {
      if (counts[s.category] !== undefined) {
        counts[s.category]++;
      } else {
        counts.general++;
      }
    });
    return counts;
  }, [scans]);

  // Filtered and sorted scans
  const filteredScans = useMemo(() => {
    return scans
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = item.detectedItem?.toLowerCase().includes(q);
          const matchesMaterial = item.material?.toLowerCase().includes(q);
          const matchesCategory = item.categoryLabel?.toLowerCase().includes(q);
          const matchesRecyclingCode = item.recyclingCode?.toLowerCase().includes(q);
          const matchesBin = item.binColor?.toLowerCase().includes(q);
          if (!matchesName && !matchesMaterial && !matchesCategory && !matchesRecyclingCode && !matchesBin) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // Bin filter
        if (selectedBin !== 'all') {
          const rawBin = (item.binColor || '').toLowerCase();
          if (selectedBin === 'blue' && !rawBin.includes('blue')) return false;
          if (selectedBin === 'green' && !rawBin.includes('green')) return false;
          if (selectedBin === 'yellow' && !rawBin.includes('yellow')) return false;
          if (selectedBin === 'red' && !rawBin.includes('red')) return false;
          if (selectedBin === 'black' && !rawBin.includes('black')) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        if (sortBy === 'carbon') {
          return (b.carbonSavedKg || 0) - (a.carbonSavedKg || 0);
        }
        if (sortBy === 'confidence') {
          return (b.confidence || 0) - (a.confidence || 0);
        }
        return 0;
      });
  }, [scans, searchQuery, selectedCategory, selectedBin, sortBy]);

  // Cumulative metrics for current gallery
  const galleryMetrics = useMemo(() => {
    const totalCarbon = scans.reduce((acc, curr) => acc + (curr.carbonSavedKg || 0), 0);
    const avgConfidence = scans.length
      ? Math.round(scans.reduce((acc, curr) => acc + curr.confidence, 0) / scans.length)
      : 0;
    
    // Top category
    const counts = categoryCounts;
    let topCat = 'recyclable';
    let maxCount = -1;
    (['recyclable', 'organic', 'ewaste', 'hazardous'] as WasteCategory[]).forEach((cat) => {
      if ((counts[cat] || 0) > maxCount) {
        maxCount = counts[cat] || 0;
        topCat = cat;
      }
    });

    return {
      totalCarbon: totalCarbon.toFixed(2),
      avgConfidence,
      topCategory: topCat.charAt(0).toUpperCase() + topCat.slice(1),
    };
  }, [scans, categoryCounts]);

  // Export summary report
  const handleExportSummary = () => {
    const textReport = [
      `EcoSort AI - Recycling History Summary Report`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Items Scanned & Archived: ${scans.length}`,
      `Cumulative CO2e Diverted: ${galleryMetrics.totalCarbon} kg`,
      `Average AI Identification Confidence: ${galleryMetrics.avgConfidence}%`,
      ``,
      `--- Scanned Items Log ---`,
      ...scans.map((s, idx) => {
        return `${idx + 1}. ${s.detectedItem} (${s.material}) | Stream: ${s.categoryLabel} | Bin: ${s.binColor || 'Standard'} | CO2 Avoided: ${s.carbonSavedKg || 0} kg | Scanned: ${new Date(s.timestamp).toLocaleDateString()}`;
      }),
    ].join('\n');

    navigator.clipboard.writeText(textReport);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const formatDisplayTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Recently';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 5) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Visual Sorting Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
            Recycling History Gallery
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Revisit your scanned items, classification tags, and verified circular disposal instructions from previous sorting efforts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="btn-scan-more-history"
            onClick={() => setActiveTab('scan')}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Scan New Item</span>
          </button>

          <button
            type="button"
            id="btn-export-history-summary"
            onClick={handleExportSummary}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200/90 transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
            title="Copy scannable text report to clipboard"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>{copiedNotification ? 'Report Copied! ✓' : 'Export Log'}</span>
          </button>

          {scans.length > 0 ? (
            <button
              type="button"
              id="btn-clear-history-dialog"
              onClick={() => setConfirmClearOpen(true)}
              className="p-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/90 transition-all shadow-xs"
              title="Clear gallery history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              id="btn-restore-history-defaults"
              onClick={onRestoreDefaults}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-emerald-700" />
              <span>Restore Samples</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. GALLERY SUMMARY STATS AT A GLANCE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
            📸
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Archived Scans
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
              {scans.length} Items
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-xl shrink-0">
            🌱
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              CO₂e Diverted
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-['Space_Grotesk',sans-serif]">
              +{galleryMetrics.totalCarbon} kg
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-xl shrink-0">
            🎯
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Avg AI Confidence
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
              {galleryMetrics.avgConfidence}%
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
            ♻️
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Top Recycled Stream
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-['Space_Grotesk',sans-serif]">
              {galleryMetrics.topCategory}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & CLASSIFICATION FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Top Search Bar & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-gallery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scanned items, materials, resin codes (e.g. PET 1, bottle, banana)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200/90 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Bin Destination Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-slate-400 font-medium hidden md:inline">Bin:</span>
              <select
                id="select-filter-bin"
                value={selectedBin}
                onChange={(e) => setSelectedBin(e.target.value)}
                className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All Bins</option>
                <option value="blue">🔵 Blue Bin (Recyclables)</option>
                <option value="green">🟢 Green Bin (Organics)</option>
                <option value="yellow">🟡 Yellow Bin (E-Waste)</option>
                <option value="red">🔴 Red Bin (Hazardous)</option>
                <option value="black">⚫ Black Bin (General)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-slate-400 font-medium hidden md:inline">Sort:</span>
              <select
                id="select-sort-history"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest Scans</option>
                <option value="oldest">Oldest Scans</option>
                <option value="carbon">Highest CO₂ Saved</option>
                <option value="confidence">Highest Confidence</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
              <button
                type="button"
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid Card View"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-view-compact"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'compact' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Compact Table View"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Classification Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Category:</span>
          </span>

          {[
            { id: 'all', label: 'All Scans', icon: '✨', count: categoryCounts.all },
            { id: 'recyclable', label: 'Recyclables', icon: '♻️', count: categoryCounts.recyclable },
            { id: 'organic', label: 'Organics', icon: '🍌', count: categoryCounts.organic },
            { id: 'ewaste', label: 'E-Waste', icon: '🔋', count: categoryCounts.ewaste },
            { id: 'hazardous', label: 'Hazardous', icon: '⚠️', count: categoryCounts.hazardous },
            { id: 'context_dependent', label: 'Mixed / Contaminated', icon: '📦', count: categoryCounts.context_dependent },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                id={`filter-pill-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. GALLERY ITEM LIST / GRID */}
      {filteredScans.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
            🔍
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {scans.length === 0 ? 'No Scanned Items in Gallery' : 'No Items Match Your Filter'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {scans.length === 0
                ? 'Capture or upload photos of waste packaging to populate your visual history gallery and track segregation impact.'
                : 'Try adjusting your search query, bin selection, or category pills to see archived scans.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {scans.length === 0 ? (
              <>
                <button
                  type="button"
                  id="btn-empty-scan-now"
                  onClick={() => setActiveTab('scan')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Scanning Waste</span>
                </button>
                <button
                  type="button"
                  id="btn-empty-restore-samples"
                  onClick={onRestoreDefaults}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200/90 shadow-xs transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-600" />
                  <span>Load Sample Scans</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedBin('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW OF SCANNED ITEMS WITH IMAGES & TAGS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredScans.map((item) => {
            const badgeClasses = getCategoryBadgeClasses(item.category);
            const isRecyclable = item.category === 'recyclable';
            const isOrganic = item.category === 'organic';
            const isEwaste = item.category === 'ewaste';
            const isHazardous = item.category === 'hazardous';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Image Container with Visual Tags Overlay */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.detectedItem}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Image fallback to stylized category pattern
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}

                  {/* Fallback Graphic if Image fails or is missing */}
                  <div className="absolute inset-0 -z-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <span className="text-3xl mb-1">
                      {isRecyclable ? '♻️' : isOrganic ? '🍌' : isEwaste ? '🔋' : isHazardous ? '⚠️' : '📦'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 max-w-[160px] truncate">
                      {item.detectedItem}
                    </span>
                  </div>

                  {/* Top-Left Category & Bin Badge */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs backdrop-blur-md ${badgeClasses.bg} ${badgeClasses.border}`}>
                      <span>
                        {isRecyclable ? '♻️' : isOrganic ? '🍌' : isEwaste ? '🔋' : isHazardous ? '⚠️' : '📦'}
                      </span>
                      <span>{item.categoryLabel || item.category}</span>
                    </span>
                  </div>

                  {/* Top-Right Confidence Badge */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.8 rounded-full bg-slate-900/80 text-white backdrop-blur-md text-[10px] font-bold shadow-xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{item.confidence}%</span>
                    </span>
                  </div>

                  {/* Bottom-Left Timestamp Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 text-slate-700 backdrop-blur-sm text-[10px] font-medium border border-slate-200/80 shadow-xs">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDisplayTime(item.timestamp)}</span>
                    </span>
                  </div>

                  {/* Hover Quick View / Zoom Button */}
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                    <button
                      type="button"
                      onClick={() => setInspectedItem(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md flex items-center gap-1.5 hover:bg-emerald-50 hover:text-emerald-800 transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Quick Inspect</span>
                    </button>
                    {item.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setZoomedImage(item.imageUrl!)}
                        className="p-1.5 rounded-xl bg-white/90 text-slate-800 shadow-md hover:bg-white transition-all active:scale-95"
                        title="Enlarge Photo"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Content & Classification Tags */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    {/* Item Title & Material */}
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {item.detectedItem}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-1">
                        {item.material}
                      </p>
                    </div>

                    {/* Classification Tags Cluster */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {/* Bin Destination Tag */}
                      {item.binColor && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span className="truncate max-w-[130px]">{item.binColor.split('(')[0]}</span>
                        </span>
                      )}

                      {/* Recyclability Status Tag */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/80">
                        {item.recyclability?.split('(')[0] || 'Segregate Properly'}
                      </span>

                      {/* Recycling Resin Code */}
                      {item.recyclingCode && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200">
                          {item.recyclingCode}
                        </span>
                      )}

                      {/* Carbon Saved Tag */}
                      {item.carbonSavedKg !== undefined && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200/80">
                          <span>🌱</span>
                          <span>+{item.carbonSavedKg} kg CO₂e</span>
                        </span>
                      )}

                      {/* Special Handling / Hazard Tag */}
                      {item.specialHandlingRequired && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[10px] font-bold border border-rose-200">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                          <span>Hazardous Drop-off</span>
                        </span>
                      )}
                    </div>

                    {/* Disposal Instruction Snippet */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                      {item.recommendedDisposal || item.disposalInstructions}
                    </p>
                  </div>

                  {/* Revisit Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      id={`btn-revisit-${item.id}`}
                      onClick={() => onSelectScan(item)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-emerald-200/80"
                      title="Open full detailed analysis result"
                    >
                      <span>Revisit Analysis</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteScan(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE / LIST VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Item & Image</th>
                  <th className="py-3.5 px-4">Category & Material</th>
                  <th className="py-3.5 px-4">Classification Tags</th>
                  <th className="py-3.5 px-4">Disposal Destination</th>
                  <th className="py-3.5 px-4">CO₂e Diverted</th>
                  <th className="py-3.5 px-4">Scanned</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScans.map((item) => {
                  const badgeClasses = getCategoryBadgeClasses(item.category);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Item & Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => item.imageUrl && setZoomedImage(item.imageUrl)}
                            className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/80 shrink-0 cursor-pointer relative group"
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.detectedItem}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-base">
                                ♻️
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-sm text-slate-900">
                              {item.detectedItem}
                            </div>
                            <div className="text-slate-500 text-[11px]">{item.material}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Material */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClasses.bg} ${badgeClasses.border}`}>
                          {item.categoryLabel || item.category}
                        </span>
                      </td>

                      {/* Tags */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                            {item.confidence}% Confidence
                          </span>
                          {item.recyclingCode && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                              {item.recyclingCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Disposal Destination */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-semibold text-slate-800 text-xs truncate">
                          {item.binColor || 'Standard Bin'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {item.whereToSegregate || item.recommendedDisposal}
                        </div>
                      </td>

                      {/* Carbon Diverted */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        +{item.carbonSavedKg || 0} kg
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDisplayTime(item.timestamp)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectScan(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-all active:scale-95"
                          >
                            Revisit
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectedItem(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Inspect details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteScan(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ITEM INSPECTION MODAL (Quick View from Gallery) */}
      <AnimatePresence>
        {inspectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectedItem(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌿</span>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {inspectedItem.detectedItem}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Scanned on {new Date(inspectedItem.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedItem(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                {/* Photo & Main Classification Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {inspectedItem.imageUrl && (
                    <div className="sm:col-span-5 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-4/3 relative group cursor-pointer"
                      onClick={() => setZoomedImage(inspectedItem.imageUrl!)}
                    >
                      <img
                        src={inspectedItem.imageUrl}
                        alt={inspectedItem.detectedItem}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Maximize2 className="w-4 h-4" />
                        <span>Enlarge Photo</span>
                      </div>
                    </div>
                  )}

                  <div className={inspectedItem.imageUrl ? 'sm:col-span-7 space-y-3' : 'sm:col-span-12 space-y-3'}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                        {inspectedItem.categoryLabel}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {inspectedItem.confidence}% Confidence
                      </span>
                      {inspectedItem.recyclingCode && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-mono font-bold border border-blue-200">
                          {inspectedItem.recyclingCode}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Material Composition
                      </div>
                      <div className="text-sm font-semibold text-slate-800">
                        {inspectedItem.material}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Target Segregation Bin
                      </div>
                      <div className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80">
                        {inspectedItem.binColor || 'Standard Recycling'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segregation Steps Checklist */}
                {inspectedItem.segregationSteps && inspectedItem.segregationSteps.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recommended Preparation & Sorting Steps</span>
                    </h4>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      {inspectedItem.segregationSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Why this result & Eco Tip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {inspectedItem.whyThisResult && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="font-bold text-slate-700">AI Visual Reasoning</div>
                      <p className="text-slate-600 leading-relaxed">{inspectedItem.whyThisResult}</p>
                    </div>
                  )}

                  {inspectedItem.ecoTip && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-emerald-600" />
                        <span>Circular Eco Tip</span>
                      </div>
                      <p className="text-emerald-900/80 leading-relaxed">{inspectedItem.ecoTip}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const item = inspectedItem;
                      setInspectedItem(null);
                      if (onAskAIWithItem) {
                        onAskAIWithItem(item);
                      } else {
                        setActiveTab('chat');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ask AI About Item</span>
                  </button>

                  {(inspectedItem.category === 'ewaste' || inspectedItem.category === 'hazardous') && (
                    <button
                      type="button"
                      onClick={() => {
                        setInspectedItem(null);
                        setActiveTab('centers');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs border border-blue-200 flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Find Drop-off Center</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  id="btn-modal-revisit-full"
                  onClick={() => {
                    const item = inspectedItem;
                    setInspectedItem(null);
                    onSelectScan(item);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  <span>Revisit Full Analysis</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. PHOTO ZOOM LIGHTBOX MODAL */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="relative max-w-3xl max-h-[85vh] w-full flex flex-col items-center">
              <button
                type="button"
                id="btn-close-zoom-lightbox"
                onClick={() => setZoomedImage(null)}
                className="absolute -top-10 right-0 text-white hover:text-emerald-400 font-bold text-sm flex items-center gap-1 p-1"
              >
                <X className="w-5 h-5" />
                <span>Close</span>
              </button>
              <img
                src={zoomedImage}
                alt="Enlarged waste scan"
                referrerPolicy="no-referrer"
                className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/20"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. CONFIRM CLEAR MODAL */}
      <AnimatePresence>
        {confirmClearOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl max-w-md w-full space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900">Clear Recycling History?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This will remove all {scans.length} archived scans from your local device storage. You can restore the curated sample scans at any time.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-confirm-clear-history"
                  onClick={() => {
                    onClearHistory();
                    setConfirmClearOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Clear History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
