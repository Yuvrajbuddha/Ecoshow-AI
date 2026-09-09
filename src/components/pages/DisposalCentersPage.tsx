import React, { useState } from 'react';
import { DisposalCenter, WasteCategory, RecyclingEvent, SimulatedLocation } from '../../types';
import { 
  SAMPLE_DISPOSAL_CENTERS, 
  SIMULATED_LOCATIONS, 
  SAMPLE_RECYCLING_EVENTS 
} from '../../services/sampleData';
import { getCategoryBadgeClasses } from '../../lib/utils';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Clock, 
  Phone, 
  CheckCircle2, 
  ExternalLink, 
  Star,
  Sparkles,
  Info,
  X,
  BellRing,
  CalendarDays,
  Gift,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Share2,
  Calendar,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DisposalCentersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCenter, setSelectedCenter] = useState<DisposalCenter | null>(null);
  const [directionsModalOpen, setDirectionsModalOpen] = useState(false);
  const [navCopiedNotice, setNavCopiedNotice] = useState<string | null>(null);

  // Simulated Location & Event Alert State
  const [currentLocationId, setCurrentLocationId] = useState<string>('metro-core');
  const [locSelectorOpen, setLocSelectorOpen] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);
  const [selectedEventModal, setSelectedEventModal] = useState<RecyclingEvent | null>(null);
  const [reminderEventIds, setReminderEventIds] = useState<string[]>([]);
  const [eventToast, setEventToast] = useState<string | null>(null);
  const [copiedEventAddress, setCopiedEventAddress] = useState<boolean>(false);

  const currentLocation = 
    SIMULATED_LOCATIONS.find((l) => l.id === currentLocationId) || SIMULATED_LOCATIONS[0];
  
  const nearbyEvents = SAMPLE_RECYCLING_EVENTS[currentLocationId] || [];
  const currentEvent = nearbyEvents[activeEventIndex % Math.max(nearbyEvents.length, 1)] || nearbyEvents[0];

  const categories = [
    { id: 'all', label: 'All Centers' },
    { id: 'ewaste', label: 'E-Waste & Batteries' },
    { id: 'recyclable', label: 'Recyclables' },
    { id: 'organic', label: 'Organic Compost' },
    { id: 'hazardous', label: 'Hazardous Waste' },
  ];

  // Dynamic distance adjustment based on simulated location for realistic immersion
  const distanceMultipliers: Record<string, Record<string, number>> = {
    'metro-core': { 'center-1': 2.1, 'center-2': 3.4, 'center-3': 4.2, 'center-4': 5.8 },
    'greenfield': { 'center-1': 3.8, 'center-2': 2.6, 'center-3': 0.8, 'center-4': 6.2 },
    'northside': { 'center-1': 4.5, 'center-2': 1.6, 'center-3': 5.1, 'center-4': 2.2 },
  };

  const filteredCenters = SAMPLE_DISPOSAL_CENTERS.map((center) => {
    const locMap = distanceMultipliers[currentLocationId];
    const adjustedDist = locMap && locMap[center.id] ? locMap[center.id] : center.distanceKm;
    return {
      ...center,
      distanceKm: adjustedDist,
    };
  })
    .filter((center) => {
      const matchesCat =
        selectedCategory === 'all' || center.category === selectedCategory;
      const matchesSearch =
        center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.acceptedMaterials.some((m) =>
          m.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const openDirections = (center: DisposalCenter) => {
    setSelectedCenter(center);
    setDirectionsModalOpen(true);
  };

  const handleToggleReminder = (eventId: string, eventTitle: string) => {
    const isSet = reminderEventIds.includes(eventId);
    if (isSet) {
      setReminderEventIds(reminderEventIds.filter((id) => id !== eventId));
      setEventToast(`Reminder removed for "${eventTitle}"`);
    } else {
      setReminderEventIds([...reminderEventIds, eventId]);
      setEventToast(`Reminder saved! We'll alert you on ${currentEvent.dateStr}.`);
    }
    setTimeout(() => {
      setEventToast(null);
    }, 3200);
  };

  const handleCopyEventAddress = (event: RecyclingEvent) => {
    setCopiedEventAddress(true);
    setEventToast(`Event location copied: ${event.locationName}, ${event.address}`);
    setTimeout(() => {
      setCopiedEventAddress(false);
      setEventToast(null);
    }, 2800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* GLOBAL TOAST NOTICE */}
      <AnimatePresence>
        {eventToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 bg-emerald-950 text-emerald-100 px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/50 flex items-center gap-2.5 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{eventToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Drop-off & Circular Events Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
            Where Can I Dispose This?
          </h1>
          <p className="text-slate-500 text-sm">
            Locate authorized municipal drop-offs, certified e-waste depots, and community recycling drives.
          </p>
        </div>

        {/* Location Selector Pill */}
        <div className="relative">
          <button
            type="button"
            id="location-selector-btn"
            onClick={() => setLocSelectorOpen(!locSelectorOpen)}
            className="flex items-center gap-2 text-xs text-slate-700 bg-white hover:bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200 shadow-xs transition-all group"
          >
            <Navigation className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Simulated Location
              </div>
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <span>{currentLocation.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
              </div>
            </div>
          </button>

          {/* Location Picker Dropdown */}
          <AnimatePresence>
            {locSelectorOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 space-y-1"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Simulate Location
                </div>
                {SIMULATED_LOCATIONS.map((loc) => {
                  const isSelected = loc.id === currentLocationId;
                  const locEventsCount = (SAMPLE_RECYCLING_EVENTS[loc.id] || []).length;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        setCurrentLocationId(loc.id);
                        setActiveEventIndex(0);
                        setIsBannerDismissed(false);
                        setLocSelectorOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{loc.name}</div>
                        <div className="text-[10px] text-slate-500">{loc.neighborhood}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {locEventsCount} event{locEventsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOCATION-BASED NOTIFICATION / UI BANNER FOR NEARBY RECYCLING EVENTS       */}
      {/* ========================================================================= */}
      {currentEvent && (
        <div>
          {!isBannerDismissed ? (
            <motion.div
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              id="recycling-event-banner"
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a291f] via-[#0f392b] to-[#124233] text-white p-5 sm:p-6 shadow-md border border-emerald-500/30"
            >
              {/* Background Geometric Rings */}
              <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full border border-emerald-400/10 pointer-events-none" />
              <div className="absolute -right-6 -top-6 w-44 h-44 rounded-full border border-emerald-400/15 pointer-events-none" />

              <div className="relative z-10 space-y-4">
                {/* Top Alert Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-700/40">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-xs font-extrabold tracking-wide">
                      <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                      <span>NEARBY EVENT ALERT</span>
                    </div>

                    <span className="hidden sm:inline-block text-xs text-emerald-200 font-medium">
                      Based on simulated GPS in <strong className="text-white">{currentLocation.neighborhood}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Multi-event switcher if more than 1 */}
                    {nearbyEvents.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setActiveEventIndex((prev) => (prev + 1) % nearbyEvents.length)}
                        className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-emerald-200 border border-white/10 transition-colors"
                      >
                        Event {activeEventIndex + 1} of {nearbyEvents.length} ↻
                      </button>
                    )}

                    {/* Dismiss button */}
                    <button
                      type="button"
                      onClick={() => setIsBannerDismissed(true)}
                      className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-white/10 transition-colors"
                      title="Minimize Alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Event Core Details Grid */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {currentEvent.daysUntilText}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-700/50">
                        {currentEvent.badge}
                      </span>
                      <span className="text-xs text-emerald-300/80 flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {currentEvent.distanceKm} km away
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk',sans-serif] tracking-tight">
                      {currentEvent.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                      {currentEvent.tagline}
                    </p>

                    {/* Date, Location, Organizer Pills */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-emerald-200/90">
                      <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-white/5">
                        <CalendarDays className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{currentEvent.dateStr} • {currentEvent.timeStr}</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-white/5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{currentEvent.locationName}</span>
                      </div>
                    </div>

                    {/* Participant Incentive Perk */}
                    {currentEvent.specialPerk && (
                      <div className="flex items-center gap-2 text-xs text-amber-200 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/30 font-medium">
                        <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{currentEvent.specialPerk}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-row lg:flex-col items-stretch gap-2.5 shrink-0 pt-2 lg:pt-0">
                    <button
                      type="button"
                      id="view-event-details-btn"
                      onClick={() => setSelectedEventModal(currentEvent)}
                      className="flex-1 lg:flex-initial px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>View Event & Route</span>
                    </button>

                    <button
                      type="button"
                      id="set-event-reminder-btn"
                      onClick={() => handleToggleReminder(currentEvent.id, currentEvent.title)}
                      className={`flex-1 lg:flex-initial px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        reminderEventIds.includes(currentEvent.id)
                          ? 'bg-emerald-800 text-emerald-200 border-emerald-500/50'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                      }`}
                    >
                      {reminderEventIds.includes(currentEvent.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Reminder Active</span>
                        </>
                      ) : (
                        <>
                          <BellRing className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Add to Reminders</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Accepted Materials Chips Preview */}
                <div className="pt-2 border-t border-emerald-700/30 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-emerald-300">Accepted Items:</span>
                  {currentEvent.acceptedItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-emerald-100 border border-white/5"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Minimized Banner State */
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-medium">
                <BellRing className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                <span>
                  <strong>Nearby Event:</strong> {currentEvent.title} ({currentEvent.distanceKm} km away • {currentEvent.dateStr})
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBannerDismissed(false)}
                  className="px-3 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition-colors"
                >
                  Show Alert
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEventModal(currentEvent)}
                  className="px-3 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200"
                >
                  View Details
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-4 sm:p-6 text-white border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[440px]">
          {/* Map Controls */}
          <div className="flex items-center justify-between z-10">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              GIS Proximity Map: {currentLocation.name}
            </span>

            <span className="text-xs text-slate-400">
              {filteredCenters.length} Centers Found
            </span>
          </div>

          {/* Stylized SVG Map Layer */}
          <div className="relative my-4 w-full h-72 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Map Roads & Contours */}
            <svg className="w-full h-full opacity-35" viewBox="0 0 600 300">
              <path d="M0,150 Q150,50 300,150 T600,150" stroke="#10B981" strokeWidth="4" fill="none" />
              <path d="M150,0 Q300,200 450,0" stroke="#3B82F6" strokeWidth="3" fill="none" />
              <path d="M50,280 L550,20" stroke="#64748B" strokeWidth="2" strokeDasharray="6 6" />
              <circle cx="300" cy="150" r="80" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" fill="none" />
              <circle cx="300" cy="150" r="140" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" fill="none" />
              <circle cx="300" cy="150" r="200" stroke="#10B981" strokeWidth="1" strokeDasharray="4 4" fill="none" />
            </svg>

            {/* User Simulated Location Marker (Center) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white animate-pulse shadow-lg ring-4 ring-blue-500/20" />
              <span className="text-[10px] font-bold bg-blue-900/90 text-blue-100 px-2.5 py-0.5 rounded-full mt-1 border border-blue-400 shadow-md">
                You are here ({currentLocation.name.split(' ')[0]})
              </span>
            </div>

            {/* SPECIAL EVENT MARKER ON GIS MAP */}
            {currentEvent && (
              <button
                type="button"
                id="map-pin-event"
                onClick={() => setSelectedEventModal(currentEvent)}
                style={{ 
                  top: `${currentEvent.coordinates.yPercent}%`, 
                  left: `${currentEvent.coordinates.xPercent}%` 
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-20"
                title={`Event: ${currentEvent.title}`}
              >
                <div className="relative flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-amber-500 group-hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl border-2 border-white transition-transform group-hover:scale-125 animate-pulse">
                    <Star className="w-4 h-4 fill-slate-950" />
                  </div>
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md border border-amber-300 mt-1 whitespace-nowrap shadow-lg flex items-center gap-1">
                    <span>⚡ EVENT</span>
                    <span>({currentEvent.distanceKm}km)</span>
                  </span>
                </div>
              </button>
            )}

            {/* Simulated Pins for Permanent Centers */}
            {filteredCenters.map((center, idx) => {
              const offsets = [
                { top: '25%', left: '26%' },
                { top: '35%', left: '76%' },
                { top: '72%', left: '32%' },
                { top: '78%', left: '74%' },
              ];
              const pos = offsets[idx % offsets.length];

              return (
                <button
                  key={center.id}
                  onClick={() => openDirections(center)}
                  style={{ top: pos.top, left: pos.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-10"
                  title={center.name}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 group-hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110">
                      <MapPin className="w-3.5 h-3.5" />
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
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Gold Marker = Active Community Event
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Green Marker = Permanent Drop-off
            </span>
          </div>
        </div>

        {/* Right Column: Center Listing Cards */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
          {/* Quick Highlight of Active Event in List */}
          {currentEvent && (
            <div 
              onClick={() => setSelectedEventModal(currentEvent)}
              className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/90 shadow-xs hover:border-amber-400 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-slate-950" />
                  Upcoming Event
                </span>
                <span className="text-xs font-bold text-amber-900 font-mono">
                  {currentEvent.distanceKm} km away
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors">
                {currentEvent.title}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-1">
                {currentEvent.locationName} • {currentEvent.dateStr}
              </p>
              <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 pt-1 border-t border-amber-200/50">
                <span>View Event Details</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          )}

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

      {/* ========================================================================= */}
      {/* RECYCLING EVENT DETAILS MODAL                                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedEventModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {selectedEventModal.daysUntilText}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {selectedEventModal.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 pt-1">
                    {selectedEventModal.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEventModal(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedEventModal.tagline}
              </p>

              {/* Info Matrix */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Date & Time:</strong> {selectedEventModal.dateStr} ({selectedEventModal.timeStr})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Venue:</strong> {selectedEventModal.locationName}, {selectedEventModal.address}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Proximity:</strong> {selectedEventModal.distanceKm} km from {currentLocation.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Organized by:</strong> {selectedEventModal.organizer}
                  </span>
                </div>
              </div>

              {/* Accepted Items List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900">Accepted Materials:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                  {selectedEventModal.acceptedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preparation Guidance */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Preparation Instructions:</span>
                </div>
                <p className="leading-relaxed pl-5">
                  {selectedEventModal.guidanceNote}
                </p>
              </div>

              {/* Perk Notice */}
              {selectedEventModal.specialPerk && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{selectedEventModal.specialPerk}</span>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleCopyEventAddress(selectedEventModal)}
                  className="flex-1 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {copiedEventAddress ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Address Copied!</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      <span>Copy Address & Route</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleReminder(selectedEventModal.id, selectedEventModal.title)}
                  className={`px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    reminderEventIds.includes(selectedEventModal.id)
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <BellRing className="w-4 h-4" />
                  <span>
                    {reminderEventIds.includes(selectedEventModal.id) ? 'Reminder Set' : 'Remind Me'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PERMANENT CENTER DIRECTIONS MODAL                                         */}
      {/* ========================================================================= */}
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
                  <span>Estimated Route from {currentLocation.name.split(' ')[0]}:</span>
                  <span className="text-emerald-700 font-mono">{selectedCenter.distanceKm} km away</span>
                </div>
                <ol className="list-decimal list-inside text-slate-600 space-y-1">
                  <li>Head toward Circular Economy Blvd</li>
                  <li>Follow GreenTech Way ({selectedCenter.distanceKm} km)</li>
                  <li>Destination drop-off depot will be on your right</li>
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
                    setNavCopiedNotice(`Address copied for navigation routing!`);
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
