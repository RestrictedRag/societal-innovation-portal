'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
  MapPin,
  Globe,
  Mail,
  Phone,
  DollarSign,
  Layers,
  Cpu,
  HeartHandshake,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export function CompanyProfileEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('Enterprise');
  const [industry, setIndustry] = useState('Smart Infrastructure & Urban Technology');
  const [sector, setSector] = useState('IoT, AI & Environmental Automation');
  const [website, setWebsite] = useState('https://nexgenlabs.demo');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Gurugram, Haryana / New Delhi');
  const [fundingCapacity, setFundingCapacity] = useState('₹50,00,000 / annum');
  const [contactPersonName, setContactPersonName] = useState('Vikram Malhotra');
  const [contactEmail, setContactEmail] = useState('vikram.malhotra@nexgenlabs.demo');
  const [contactPhone, setContactPhone] = useState('+91 98100 12345');

  // Tag inputs (comma separated)
  const [areasOfExpertise, setAreasOfExpertise] = useState('IoT, Edge AI, Acoustic Sensors, Structural Analytics');
  const [technologies, setTechnologies] = useState('Python, Embedded C, LoRaWAN, STM32, Computer Vision, GCP');
  const [csrInterests, setCsrInterests] = useState('Clean Water, Renewable Energy, Waste Segregation, Student Tech Internships');
  const [innovationInterests, setInnovationInterests] = useState('Urban Sensor Meshes, Subsurface Leak Detection, Drone Microgrid Mapping');
  const [preferredDomains, setPreferredDomains] = useState('water_management, waste_management, clean_energy, urban_infrastructure');
  const [availableResources, setAvailableResources] = useState('Escrow R&D Grants, Hardware Evaluation Kits, Senior Mentorship, Live Corridor Testbeds');
  const [pilotLocations, setPilotLocations] = useState('Delhi NCR Transit Corridor, Outer Ring Road, Gurugram Industrial Zone');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/industry/profile');
      if (res.ok) {
        const data = await res.json();
        const p = data.profile || {};
        setCompanyName(p.companyName || '');
        setCompanyType(p.companyType || 'Enterprise');
        setIndustry(p.industry || 'Smart Infrastructure');
        setSector(p.sector || 'Urban Tech');
        setWebsite(p.website || '');
        setDescription(p.description || '');
        setLocation(p.location || '');
        setFundingCapacity(p.fundingCapacity || '₹50,00,000');
        setContactPersonName(p.contactPersonName || '');
        setContactEmail(p.contactEmail || '');
        setContactPhone(p.contactPhone || '');

        if (p.areasOfExpertise) setAreasOfExpertise(p.areasOfExpertise.join(', '));
        if (p.technologies) setTechnologies(p.technologies.join(', '));
        if (p.csrInterests) setCsrInterests(p.csrInterests.join(', '));
        if (p.innovationInterests) setInnovationInterests(p.innovationInterests.join(', '));
        if (p.preferredDomains) setPreferredDomains(p.preferredDomains.join(', '));
        if (p.availableResources) setAvailableResources(p.availableResources.join(', '));
        if (p.pilotLocations) setPilotLocations(p.pilotLocations.join(', '));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const parseTags = (str: string) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    try {
      const res = await fetch('/api/industry/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyType: companyType.trim(),
          industry: industry.trim(),
          sector: sector.trim(),
          website: website.trim(),
          description: description.trim(),
          location: location.trim(),
          fundingCapacity: fundingCapacity.trim(),
          contactPersonName: contactPersonName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          areasOfExpertise: parseTags(areasOfExpertise),
          technologies: parseTags(technologies),
          csrInterests: parseTags(csrInterests),
          innovationInterests: parseTags(innovationInterests),
          preferredDomains: parseTags(preferredDomains),
          availableResources: parseTags(availableResources),
          pilotLocations: parseTags(pilotLocations),
        }),
      });

      if (!res.ok) throw new Error('Failed to update company profile.');

      setFeedback({ type: 'success', text: 'Company profile and CSR interests updated successfully in database!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-nexus-primary" />
        <span>Loading company profile settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight">Company Innovation Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your technical expertise, available resources, and pilot facilities to power AI recommendations.
          </p>
        </div>

        <button
          form="profile-form"
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nexus-primary text-white text-xs font-bold hover:bg-nexus-primary-container transition shadow-md shadow-nexus-primary/20 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Profile Changes
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Form */}
      <form id="profile-form" onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Basic Org Info */}
        <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-nexus-primary" /> Organization Overview
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Company / Entity Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Organization Type</label>
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-800 outline-none focus:border-nexus-primary focus:bg-white transition"
              >
                <option value="Enterprise">Enterprise / MNC</option>
                <option value="Startup">Growth Stage Startup / Scaleup</option>
                <option value="SME">Small & Medium Enterprise (SME)</option>
                <option value="PSU">Public Sector Undertaking (PSU)</option>
                <option value="Foundation">CSR Foundation / Trust</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Industry Vertical</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Operating Sector</label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Company Description & Mission</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Primary Headquarters Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Official Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Technical Capabilities & CSR Focus */}
        <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-nexus-primary" /> Technical Expertise & CSR Priorities
          </h3>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Areas of Technical Expertise (Comma separated)
            </label>
            <input
              type="text"
              value={areasOfExpertise}
              onChange={(e) => setAreasOfExpertise(e.target.value)}
              placeholder="IoT, Edge AI, Acoustic Sensors, Hydrology"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Core Technologies & Frameworks (Comma separated)
            </label>
            <input
              type="text"
              value={technologies}
              onChange={(e) => setTechnologies(e.target.value)}
              placeholder="Python, Embedded C, STM32, LoRaWAN, Cloud Analytics"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                CSR Social Impact Focus (Comma separated)
              </label>
              <input
                type="text"
                value={csrInterests}
                onChange={(e) => setCsrInterests(e.target.value)}
                placeholder="Clean Water, Renewable Energy, Waste Segregation"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Annual CSR Grant Capacity
              </label>
              <input
                type="text"
                value={fundingCapacity}
                onChange={(e) => setFundingCapacity(e.target.value)}
                placeholder="e.g. ₹50,00,000 / annum"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Designated Municipal Pilot Facilities & Locations (Comma separated)
            </label>
            <input
              type="text"
              value={pilotLocations}
              onChange={(e) => setPilotLocations(e.target.value)}
              placeholder="Outer Ring Road, Gurugram Industrial Zone, Delhi NCR"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
            />
          </div>
        </div>

        {/* Section 3: Contact Representative */}
        <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="font-serif text-base font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-nexus-primary" /> Corporate Point of Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Name</label>
              <input
                type="text"
                value={contactPersonName}
                onChange={(e) => setContactPersonName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Official Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-nexus-primary focus:bg-white transition"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
