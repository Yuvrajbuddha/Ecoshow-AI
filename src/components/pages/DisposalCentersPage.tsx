import React, { useState } from 'react';
import { DisposalCenter, WasteCategory } from '../../types';
import { SAMPLE_DISPOSAL_CENTERS } from '../../services/sampleData';
import { getCategoryBadgeClasses } from '../../lib/utils';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Clock, 
  Phone, 
  CheckCircle2, 
  Filter, 
  ExternalLink, 
  Star,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DisposalCentersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCenter, setSelectedCenter] = useState<DisposalCenter | null>(null);
  const [directionsModalOpen, setDirectionsModalOpen] = useState(false);
  const [navCopiedNotice, setNavCopiedNotice] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Centers' },
    { id: 'ewaste', label: 'E-Waste & Batteries' },
    { id: 'recyclable', label: 'Recyclables' },
    { id: 'organic', label: 'Organic Compost' },
    { id: 'hazardous', label: 'Hazardous Waste' },
  ];

  const filteredCenters = SAMPLE_DISPOSAL_CENTERS.filter((center) => {
    const matchesCat =
      selectedCategory === 'all' || center.category === selectedCategory;
    const matchesSearch =
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.acceptedMaterials.some((m) =>
        m.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCat && matchesSearch;
  });

  const openDirections = (center: DisposalCenter) => {
    setSelectedCenter(center);
    setDirectionsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Drop-off Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
            Where Can I Dispose This?
          </h1>
          <p className="text-slate-500 text-sm">
            Locate authorized municipal drop-offs, certified e-waste depots, and community compost hubs.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
          <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Current Location: <strong>Metro Area (~2 km radius)</strong></span>
        </div>
      </div>

      {/* SEARCH & CATEGORY FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="center-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by facility name, address, or material (e.g., batteries, paint, glass)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAP & LIST GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map Component */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-4 sm:p-6 text-white border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[420px]">
          {/* Map Controls */}
          <div className="flex items-center justify-between z-10">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live GIS Map Simulation
            </span>

            <span className="text-xs text-slate-400">
              {filteredCenters.length} Centers Found
            </span>
          </div>

          {/* Stylized SVG Map Layer */}
          <div className="relative my-4 w-full h-64 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Map Roads & Contours */}
            <svg className="w-full h-full opacity-35" viewBox="0 0 600 300">
              <path d="M0,150 Q150,50 300,150 T600,150" stroke="#10B981" strokeWidth="4" fill="none" />
              <path d="M150,0 Q300,200 450,0" stroke="#3B82F6" strokeWidth="3" fill="none" />
              <path d="M50,280 L550,20" stroke="#64748B" strokeWidth="2" strokeDasharray="6 6" />
              <circle cx="300" cy="150" r="80" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" fill="none" />
              <circle cx="300" cy="150" r="140" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" fill="none" />
            </svg>

            {/* User Location Marker (Center) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white animate-pulse shadow-lg" />
              <span className="text-[10px] font-bold bg-blue-900/90 px-2 py-0.5 rounded-full mt-1 border border-blue-400">
                You are here
              </span>
            </div>

            {/* Simulated Pins for Centers */}
            {filteredCenters.map((center, idx) => {
              // Deterministic spread positions
              const offsets = [
                { top: '28%', left: '30%' },
                { top: '35%', left: '72%' },
                { top: '68%', left: '38%' },
                { top: '75%', left: '68%' },
              ];
              const pos = offsets[idx % offsets.length];

              return (
                <button
                  key={center.id}
                  onClick={() => openDirections(center)}
                  style={{ top: pos.top, left: pos.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
                  title={center.name}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 group-hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-md border border-slate-700 mt-1 whitespace-nowrap shadow-md group-hover:border-emerald-400">
                      {center.name.split(' ')[0]} ({center.distanceKm}km)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map bottom note */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Powered by EcoSort GeoLocator Engine</span>
            <span>Ready for Google Maps Platform</span>
          </div>
        </div>

        {/* Right Column: Center Listing Cards */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
          {filteredCenters.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
              <div className="text-3xl">📍</div>
              <h3 className="font-bold text-slate-800">No matching disposal centers found</h3>
              <p className="text-xs text-slate-500">
                Try searching for a different item or switch the category filter to "All Centers".
              </p>
            </div>
          ) : (
            filteredCenters.map((center) => {
              const badge = getCategoryBadgeClasses(center.category);
              return (
                <div
                  key={center.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.border}`}
                        >
                          {center.categoryLabel}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {center.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900">{center.name}</h3>
                      <p className="text-xs text-slate-500">{center.address}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-extrabold text-slate-900">
                        {center.distanceKm} km
                      </span>
                      <div className="text-[10px] text-slate-400">away</div>
                    </div>
                  </div>

                  {/* Accepted Materials Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {center.acceptedMaterials.map((mat, mIdx) => (
                      <span
                        key={mIdx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{center.openingHours}</span>
                    </div>

                    <button
                      id={`btn-directions-${center.id}`}
                      onClick={() => openDirections(center)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Get Directions</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DIRECTIONS MODAL */}
      <AnimatePresence>
        {directionsModalOpen && selectedCenter && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {selectedCenter.categoryLabel}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedCenter.name}</h3>
                </div>
                <button
                  onClick={() => setDirectionsModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{selectedCenter.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{selectedCenter.openingHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{selectedCenter.phone}</span>
                </div>
              </div>

              {/* Turn-by-turn route preview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Estimated Route: 6 mins</span>
                  <span className="text-emerald-700 font-mono">2.1 km away</span>
                </div>
                <ol className="list-decimal list-inside text-slate-600 space-y-1">
                  <li>Head north toward Circular Economy Blvd</li>
                  <li>Turn right onto GreenTech Way (1.2 km)</li>
                  <li>Destination drop-off depot will be on the right</li>
                </ol>
              </div>

              {navCopiedNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{navCopiedNotice}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const addressQuery = encodeURIComponent(`${selectedCenter.name}, ${selectedCenter.address}`);
                    setNavCopiedNotice(`Address copied for Google Maps routing!`);
                    setTimeout(() => {
                      setDirectionsModalOpen(false);
                      setNavCopiedNotice(null);
                    }, 1400);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Copy Map Route</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionsModalOpen(false)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
