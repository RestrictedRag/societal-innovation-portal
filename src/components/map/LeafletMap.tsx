'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface ProblemItem {
  id: string;
  title: string;
  description: string;
  domain: string;
  status: string;
  image_url: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  region_name: string;
  author_name: string | null;
  active_claims_count: number;
}

export interface RegionData {
  region_name: string;
  center_lat: number;
  center_lng: number;
  total_problems: number;
  open_count: number;
  inProgress_count?: number;
  claimed_count?: number;
  pending_count?: number;
  domains_breakdown?: Record<string, number>;
}

interface LeafletMapProps {
  regions: RegionData[];
  problems?: ProblemItem[];
  selectedRegion: string | null;
  selectedProblemId?: string | null;
  onSelectRegion: (regionName: string | null) => void;
  onSelectProblem?: (problemId: string | null) => void;
}

export default function LeafletMap({
  regions,
  problems = [],
  selectedRegion,
  selectedProblemId,
  onSelectRegion,
  onSelectProblem,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Clear any stale Leaflet container ID left from previous fast refresh
      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      // Initialize Leaflet map with standard OpenStreetMap raster tiles
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // Center on India
        zoom: 5,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // Update region clusters and problem dots dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup || !mapContainerRef.current) return;

    markersGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Plot Regional Density Area Hubs (Soft semi-transparent backdrop rings)
    regions.forEach((region) => {
      if (!Number.isFinite(region.center_lat) || !Number.isFinite(region.center_lng)) return;

      const isRegionSelected = selectedRegion === region.region_name;
      const count = Number(region.total_problems) || 0;
      const radius = Math.min(18 + Math.log2(count + 1) * 6, 36);

      const regionCircle = L.circleMarker([region.center_lat, region.center_lng], {
        radius: isRegionSelected ? radius + 6 : radius,
        fillColor: '#003527',
        color: isRegionSelected ? '#10B981' : '#047857',
        weight: isRegionSelected ? 3 : 1.5,
        opacity: 0.7,
        fillOpacity: isRegionSelected ? 0.25 : 0.12,
      });

      regionCircle.bindTooltip(
        `<strong>📍 ${region.region_name} Municipal Hub</strong><br/>${count} ${
          count === 1 ? 'Problem' : 'Problems'
        } Reported<br/><span style="font-size:10px; color:#065f46;">Click to filter region</span>`,
        { direction: 'top', offset: [0, -10] },
      );

      regionCircle.on('click', () => {
        if (selectedRegion === region.region_name) {
          onSelectRegion(null);
        } else {
          onSelectRegion(region.region_name);
        }
      });

      regionCircle.addTo(markersGroup);
      bounds.extend([region.center_lat, region.center_lng]);
    });

    // 2. Plot Individual Problem Dots across different locations
    problems.forEach((problem) => {
      if (!Number.isFinite(problem.latitude) || !Number.isFinite(problem.longitude)) return;

      const isSelected = selectedProblemId === problem.id;

      // Color mapping by problem lifecycle state
      let dotFillColor = '#059669'; // Emerald default for OPEN
      if (problem.status === 'IN_PROGRESS' || problem.status === 'CLAIMED') {
        dotFillColor = '#2563EB'; // Blue for Active Research
      } else if (problem.status === 'MERGED' || problem.status === 'RESOLVED') {
        dotFillColor = '#7C3AED'; // Purple for Resolved
      } else if (problem.status === 'PENDING' || problem.status === 'PENDING_MODERATION') {
        dotFillColor = '#D97706'; // Amber for Under Review
      } else if (problem.status === 'REJECTED') {
        dotFillColor = '#DC2626'; // Red for Rejected
      }

      const problemDot = L.circleMarker([problem.latitude, problem.longitude], {
        radius: isSelected ? 11 : 6.5,
        fillColor: dotFillColor,
        color: isSelected ? '#FACC15' : '#FFFFFF',
        weight: isSelected ? 3.5 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 1 : 0.9,
      });

      // Hover Tooltip with problem details and CTA
      const tooltipContent = `
        <div style="font-family: inherit; max-width: 220px; padding: 2px;">
          <div style="font-weight: 700; font-size: 12px; color: #0f172a; line-height: 1.3;">${problem.title}</div>
          <div style="display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;">
            <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; background: #e0f2fe; color: #0369a1; padding: 1px 5px; border-radius: 4px;">
              ${problem.domain ? problem.domain.replace(/_/g, ' ') : 'General'}
            </span>
            <span style="font-size: 9px; font-weight: 700; background: #f1f5f9; color: #334155; padding: 1px 5px; border-radius: 4px;">
              ${problem.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div style="margin-top: 6px; font-size: 10px; color: #003527; font-weight: 600; display: flex; items-center; gap: 3px;">
            <span>👇 Click to select problem statement below</span>
          </div>
        </div>
      `;

      problemDot.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -8],
        opacity: 0.98,
      });

      // Click Dot Handler: Select Problem & Scroll Down smoothly
      problemDot.on('click', () => {
        if (onSelectProblem) {
          onSelectProblem(problem.id);
        }

        // Smooth scroll to problem statement card below
        const targetElement = document.getElementById(`problem-card-${problem.id}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });

      problemDot.addTo(markersGroup);
      bounds.extend([problem.latitude, problem.longitude]);
    });

    // Auto-fit bounds if we have coordinates and no specific problem is actively selected
    if (bounds.isValid() && (regions.length > 0 || problems.length > 0) && mapInstanceRef.current && !selectedProblemId) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12, animate: false });
      } catch {
        // Guard against unmount during bounds fit
      }
    }
  }, [regions, problems, selectedRegion, selectedProblemId, onSelectRegion, onSelectProblem]);

  // When selectedProblemId changes from outside, gently center map on it
  useEffect(() => {
    if (!selectedProblemId || !mapInstanceRef.current) return;
    const selected = problems.find((p) => p.id === selectedProblemId);
    if (selected && Number.isFinite(selected.latitude) && Number.isFinite(selected.longitude)) {
      try {
        mapInstanceRef.current.panTo([selected.latitude, selected.longitude], { animate: true });
      } catch {
        // Ignore unmount transitions
      }
    }
  }, [selectedProblemId, problems]);

  return (
    <div className="relative w-full h-[450px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Interactive Map Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/90 shadow-md text-xs space-y-2 max-w-xs">
        <div className="font-bold text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-nexus-primary" /> Civic Problem Dots
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Click dot to select</span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block shadow-sm" /> Open for Research
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] inline-block shadow-sm" /> Active Capstone
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] inline-block shadow-sm" /> Under Review
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] inline-block shadow-sm" /> Merged Solution
          </span>
        </div>
      </div>
    </div>
  );
}
