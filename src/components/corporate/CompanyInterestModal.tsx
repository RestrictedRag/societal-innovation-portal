'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  Calendar,
  Mail,
  User,
  GraduationCap,
  Building2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface CompanyInterestModalProps {
  projectId: string;
  projectTitle: string;
  universityName: string;
  studentName?: string;
  studentEmail?: string;
  studentId?: string;
  facultyName?: string;
  facultyId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CompanyInterestModal({
  projectId,
  projectTitle,
  universityName,
  studentName,
  studentId,
  facultyName,
  facultyId,
  onClose,
  onSuccess,
}: CompanyInterestModalProps) {
  const [targetType, setTargetType] = useState<'PROJECT' | 'FACULTY' | 'STUDENT'>('PROJECT');
  const [interestType, setInterestType] = useState<
    'EXPLORATORY_MEETING' | 'MENTORSHIP' | 'PILOT_DISCUSSION' | 'CSR_FUNDING' | 'TALENT_ACQUISITION'
  >('EXPLORATORY_MEETING');
  const [message, setMessage] = useState('');
  const [supportDetails, setSupportDetails] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setStatusMessage(null);

    const targetUserId = targetType === 'FACULTY' ? facultyId : targetType === 'STUDENT' ? studentId : null;

    try {
      const res = await fetch('/api/industry/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          targetType,
          targetUserId,
          interestType,
          message: message.trim(),
          supportDetails: supportDetails.trim() || undefined,
          preferredTime: preferredTime.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit interest request.');

      setStatusMessage({
        type: 'success',
        text: 'Meeting & interest request dispatched! The academic team will be notified.',
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="w-full max-w-xl my-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-nexus-primary/10 text-nexus-primary flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-nexus-primary">Express Interest / Request Meeting</h3>
              <p className="text-xs text-slate-500">Direct structured outreach with university researchers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Info */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Target Project</span>
          <p className="font-bold text-slate-900 text-sm">{projectTitle}</p>
          <div className="flex items-center gap-4 text-slate-500 pt-0.5">
            <span>🏛️ {universityName}</span>
            {studentName && <span>🎓 Lead: {studentName}</span>}
            {facultyName && <span>👨‍🏫 Faculty: {facultyName}</span>}
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Outreach Type */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Outreach Purpose</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'EXPLORATORY_MEETING', label: 'Exploratory Call' },
                { id: 'MENTORSHIP', label: 'Mentorship Intro' },
                { id: 'PILOT_DISCUSSION', label: 'Pilot Scope' },
                { id: 'CSR_FUNDING', label: 'CSR Funding Grant' },
                { id: 'TALENT_ACQUISITION', label: 'Student Hiring' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setInterestType(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition font-semibold ${
                    interestType === opt.id
                      ? 'border-nexus-primary bg-nexus-primary/5 text-nexus-primary font-bold ring-1 ring-nexus-primary'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Recipient */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Direct To</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTargetType('PROJECT')}
                className={`flex-1 p-2 rounded-xl border text-center font-semibold transition ${
                  targetType === 'PROJECT'
                    ? 'border-nexus-primary bg-nexus-primary/5 text-nexus-primary font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Entire Project Team
              </button>
              {studentName && (
                <button
                  type="button"
                  onClick={() => setTargetType('STUDENT')}
                  className={`flex-1 p-2 rounded-xl border text-center font-semibold transition ${
                    targetType === 'STUDENT'
                      ? 'border-nexus-primary bg-nexus-primary/5 text-nexus-primary font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Student Lead ({studentName.split(' ')[0]})
                </button>
              )}
              {facultyName && (
                <button
                  type="button"
                  onClick={() => setTargetType('FACULTY')}
                  className={`flex-1 p-2 rounded-xl border text-center font-semibold transition ${
                    targetType === 'FACULTY'
                      ? 'border-nexus-primary bg-nexus-primary/5 text-nexus-primary font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Faculty Mentor
                </button>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Message / Agenda <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your collaboration vision, questions regarding the prototype, or trial scope..."
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Preferred Time / Slot</label>
              <input
                type="text"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="e.g. Next Tuesday 3:00 PM IST"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Your Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="partner@nexgenlabs.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Dispatch Meeting Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
