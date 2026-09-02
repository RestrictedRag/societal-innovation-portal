'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Check,
  Building2,
  Cpu,
  Database,
  Cloud,
  Layers,
  GraduationCap,
  MapPin,
  DollarSign,
  Users,
  Code2,
  Loader2,
  Send,
} from 'lucide-react';

interface ResourceOfferingModalProps {
  projectId: string;
  projectTitle: string;
  universityName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const RESOURCE_TYPES = [
  { id: 'MENTORSHIP', label: 'Mentorship & R&D Guidance', icon: Users, desc: 'Provide industry domain experts to advise students' },
  { id: 'FUNDING', label: 'Direct Grant / Escrow Funding', icon: DollarSign, desc: 'Fund milestone development or hardware procurement' },
  { id: 'HARDWARE', label: 'Hardware & Sensor Kits', icon: Cpu, desc: 'Supply microcontrollers, IoT boards, or sensors' },
  { id: 'SOFTWARE', label: 'Software Licenses & CAD Tools', icon: Layers, desc: 'Enterprise simulation or modeling software licenses' },
  { id: 'APIS', label: 'Proprietary APIs & SDKs', icon: Code2, desc: 'Enterprise developer sandbox access' },
  { id: 'DATASETS', label: 'Industrial Datasets', icon: Database, desc: 'Real-world operational logs or sensor datasets' },
  { id: 'CLOUD_CREDITS', label: 'Cloud Compute & GPU Credits', icon: Cloud, desc: 'AI training credits (GCP, AWS, Azure)' },
  { id: 'LAB_ACCESS', label: 'Specialized Lab Facilities', icon: Building2, desc: 'Advanced testing benches or cleanrooms' },
  { id: 'INTERNSHIPS', label: 'Student Internships', icon: GraduationCap, desc: 'Paid R&D positions for top project contributors' },
  { id: 'PILOT_LOCATION', label: 'Live Pilot Testbed Location', icon: MapPin, desc: 'Commercial site or factory floor for pilot testing' },
];

export function ResourceOfferingModal({
  projectId,
  projectTitle,
  universityName,
  onClose,
  onSuccess,
}: ResourceOfferingModalProps) {
  const [selectedType, setSelectedType] = useState<string>('MENTORSHIP');
  const [details, setDetails] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/industry/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          offeringType: selectedType,
          details: details.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit resource offer.');
      }

      setStatusMessage('Resource offer dispatched to student project team!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Error submitting offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-2xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-nexus-primary/10 text-nexus-primary flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-nexus-primary">Offer Resource Support</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Support this university R&D initiative with funding, mentorship, hardware, or pilot testbeds.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Target */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs space-y-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Target Project</span>
          <p className="font-bold text-slate-900 text-sm">{projectTitle}</p>
          <p className="text-slate-500">Lead Academic Partner: {universityName}</p>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Resource Types Grid */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider">
              Select Offering Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {RESOURCE_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-nexus-primary bg-nexus-primary/5 ring-1 ring-nexus-primary shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-nexus-primary text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{type.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-nexus-primary" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{type.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Offering Specifics & Terms <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Providing 5x STM32 evaluation boards, 20 hours of senior engineering review, and cloud API keys..."
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition resize-y"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !details.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Dispatch Resource Offer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
