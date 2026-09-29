'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BudgetPeriod, BudgetScope } from '@prisma/client';

// ─── Types ───────────────────────────────────────────────────────────────────

type Student = {
  id: string; firstName: string; lastName: string;
  dateOfBirth: string | null; nationality: string;
  currentCountry: string; phone: string | null;
};

type AcademicRecord = {
  id: string; institutionName: string; degreeLevel: string;
  fieldOfStudy: string; gradeValue: number | null; gradeScale: number | null;
  startDate: string | null; endDate: string | null;
};

type Preferences = {
  targetDegreeLevel: string | null;
  fieldsOfInterest: string[];
  preferredCountries: string[];
  preferredLanguages: string[];
  studyModes: string[];
};

type Budget = {
  amount: number; currency: string;
  period: BudgetPeriod; scope: BudgetScope;
};

interface Props {
  student: Student | null;
  academicRecords: AcademicRecord[];
  preferences: Preferences | null;
  budget: Budget | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card space-y-4">
      <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition';
const btnPrimary = 'rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors disabled:opacity-60';
const btnGhost = 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors';

function tagList(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfileClient({ student, academicRecords, preferences, budget }: Props) {
  const router = useRouter();

  // ── Profile form ──
  const [profileForm, setProfileForm] = useState({
    firstName: student?.firstName ?? '',
    lastName: student?.lastName ?? '',
    nationality: student?.nationality ?? '',
    currentCountry: student?.currentCountry ?? '',
    phone: student?.phone ?? '',
    dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.substring(0, 10) : '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true); setProfileMsg(null);
    const res = await fetch('/api/v1/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: profileForm.firstName || undefined,
        lastName: profileForm.lastName || undefined,
        nationality: profileForm.nationality || undefined,
        currentCountry: profileForm.currentCountry || undefined,
        phone: profileForm.phone || null,
        dateOfBirth: profileForm.dateOfBirth || null,
      }),
    });
    setProfileSaving(false);
    setProfileMsg(res.ok
      ? { ok: true, text: 'Profile saved.' }
      : { ok: false, text: 'Failed to save. Try again.' });
    if (res.ok) router.refresh();
  }

  // ── Budget form ──
  const [budgetForm, setBudgetForm] = useState({
    amount: String(budget?.amount ?? ''),
    currency: budget?.currency ?? 'EUR',
    period: budget?.period ?? 'YEARLY',
    scope: budget?.scope ?? 'TOTAL_COST',
  });
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetMsg, setBudgetMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveBudget(e: React.FormEvent) {
    e.preventDefault();
    setBudgetSaving(true); setBudgetMsg(null);
    const res = await fetch('/api/v1/me/budget', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(budgetForm.amount),
        currency: budgetForm.currency.toUpperCase(),
        period: budgetForm.period,
        scope: budgetForm.scope,
      }),
    });
    setBudgetSaving(false);
    setBudgetMsg(res.ok ? { ok: true, text: 'Budget saved.' } : { ok: false, text: 'Check the values and retry.' });
    if (res.ok) router.refresh();
  }

  // ── Preferences form ──
  const [prefsForm, setPrefsForm] = useState({
    targetDegreeLevel: preferences?.targetDegreeLevel ?? '',
    fieldsOfInterest: preferences?.fieldsOfInterest.join(', ') ?? '',
    preferredCountries: preferences?.preferredCountries.join(', ') ?? '',
    preferredLanguages: preferences?.preferredLanguages.join(', ') ?? '',
    studyModes: preferences?.studyModes.join(', ') ?? '',
  });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setPrefsSaving(true); setPrefsMsg(null);
    const res = await fetch('/api/v1/me/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetDegreeLevel: prefsForm.targetDegreeLevel || null,
        fieldsOfInterest: tagList(prefsForm.fieldsOfInterest),
        preferredCountries: tagList(prefsForm.preferredCountries),
        preferredLanguages: tagList(prefsForm.preferredLanguages),
        studyModes: tagList(prefsForm.studyModes),
      }),
    });
    setPrefsSaving(false);
    setPrefsMsg(res.ok ? { ok: true, text: 'Preferences saved.' } : { ok: false, text: 'Save failed. Try again.' });
    if (res.ok) router.refresh();
  }

  // ── Academic records ──
  const [records, setRecords] = useState<AcademicRecord[]>(academicRecords);
  const [newRecord, setNewRecord] = useState({ institutionName: '', degreeLevel: '', fieldOfStudy: '', gradeValue: '', gradeScale: '', startDate: '', endDate: '' });
  const [addingRecord, setAddingRecord] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  async function addRecord(e: React.FormEvent) {
    e.preventDefault();
    setAddingRecord(true);
    const res = await fetch('/api/v1/me/academic-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionName: newRecord.institutionName,
        degreeLevel: newRecord.degreeLevel,
        fieldOfStudy: newRecord.fieldOfStudy,
        gradeValue: newRecord.gradeValue ? Number(newRecord.gradeValue) : null,
        gradeScale: newRecord.gradeScale ? Number(newRecord.gradeScale) : null,
        startDate: newRecord.startDate || null,
        endDate: newRecord.endDate || null,
      }),
    });
    setAddingRecord(false);
    if (res.ok) {
      const { data } = await res.json();
      setRecords((r) => [data, ...r]);
      setNewRecord({ institutionName: '', degreeLevel: '', fieldOfStudy: '', gradeValue: '', gradeScale: '', startDate: '', endDate: '' });
      setShowAddForm(false);
    }
  }

  async function deleteRecord(id: string) {
    await fetch(`/api/v1/me/academic-records/${id}`, { method: 'DELETE' });
    setRecords((r) => r.filter((rec) => rec.id !== id));
  }

  if (!student) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center max-w-sm">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="font-semibold text-amber-900">No student profile found</p>
          <p className="mt-1 text-sm text-amber-700">Your account isn&apos;t linked to a student profile yet.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Keep your info up to date to get the best matches.</p>
      </div>

      {/* ── Personal info ── */}
      <Section title="Personal information">
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input className={inputCls} value={profileForm.firstName} onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Alice" />
            </Field>
            <Field label="Last name">
              <input className={inputCls} value={profileForm.lastName} onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Dupont" />
            </Field>
            <Field label="Nationality">
              <input className={inputCls} value={profileForm.nationality} onChange={(e) => setProfileForm((f) => ({ ...f, nationality: e.target.value }))} placeholder="French" />
            </Field>
            <Field label="Current country">
              <input className={inputCls} value={profileForm.currentCountry} onChange={(e) => setProfileForm((f) => ({ ...f, currentCountry: e.target.value }))} placeholder="France" />
            </Field>
            <Field label="Phone (optional)">
              <input className={inputCls} value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+33 6 00 00 00 00" />
            </Field>
            <Field label="Date of birth">
              <input type="date" className={inputCls} value={profileForm.dateOfBirth} onChange={(e) => setProfileForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
            </Field>
          </div>
          {profileMsg && (
            <p className={`text-sm ${profileMsg.ok ? 'text-brand-700' : 'text-red-600'}`}>{profileMsg.text}</p>
          )}
          <button type="submit" disabled={profileSaving} className={btnPrimary}>
            {profileSaving ? 'Saving…' : 'Save personal info'}
          </button>
        </form>
      </Section>

      {/* ── Academic records ── */}
      <Section title="Academic records">
        {records.length > 0 ? (
          <ul className="space-y-3">
            {records.map((r) => (
              <li key={r.id} className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.institutionName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {r.degreeLevel} · {r.fieldOfStudy}
                    {r.gradeValue != null && r.gradeScale != null && ` · ${r.gradeValue}/${r.gradeScale}`}
                  </p>
                  {(r.startDate || r.endDate) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {r.startDate?.substring(0, 7)} – {r.endDate?.substring(0, 7) ?? 'present'}
                    </p>
                  )}
                </div>
                <button onClick={() => deleteRecord(r.id)} className="ml-4 text-xs text-red-400 hover:text-red-600 transition-colors">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No academic records yet.</p>
        )}

        {!showAddForm ? (
          <button onClick={() => setShowAddForm(true)} className={btnGhost}>
            + Add record
          </button>
        ) : (
          <form onSubmit={addRecord} className="space-y-3 border-t border-slate-100 pt-4 mt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Institution *">
                <input required className={inputCls} placeholder="MIT" value={newRecord.institutionName} onChange={(e) => setNewRecord((r) => ({ ...r, institutionName: e.target.value }))} />
              </Field>
              <Field label="Degree level *">
                <input required className={inputCls} placeholder="Bachelor" value={newRecord.degreeLevel} onChange={(e) => setNewRecord((r) => ({ ...r, degreeLevel: e.target.value }))} />
              </Field>
              <Field label="Field of study *">
                <input required className={inputCls} placeholder="Computer Science" value={newRecord.fieldOfStudy} onChange={(e) => setNewRecord((r) => ({ ...r, fieldOfStudy: e.target.value }))} />
              </Field>
              <Field label="Grade (e.g. 16)">
                <input type="number" step="0.01" className={inputCls} placeholder="16" value={newRecord.gradeValue} onChange={(e) => setNewRecord((r) => ({ ...r, gradeValue: e.target.value }))} />
              </Field>
              <Field label="Grade scale (e.g. 20)">
                <input type="number" step="0.01" className={inputCls} placeholder="20" value={newRecord.gradeScale} onChange={(e) => setNewRecord((r) => ({ ...r, gradeScale: e.target.value }))} />
              </Field>
              <Field label="Start date">
                <input type="date" className={inputCls} value={newRecord.startDate} onChange={(e) => setNewRecord((r) => ({ ...r, startDate: e.target.value }))} />
              </Field>
              <Field label="End date">
                <input type="date" className={inputCls} value={newRecord.endDate} onChange={(e) => setNewRecord((r) => ({ ...r, endDate: e.target.value }))} />
              </Field>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={addingRecord} className={btnPrimary}>{addingRecord ? 'Adding…' : 'Add record'}</button>
              <button type="button" onClick={() => setShowAddForm(false)} className={btnGhost}>Cancel</button>
            </div>
          </form>
        )}
      </Section>

      {/* ── Study preferences ── */}
      <Section title="Study preferences">
        <form onSubmit={savePrefs} className="space-y-4">
          <p className="text-xs text-slate-400">Separate multiple values with a comma.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target degree level">
              <input className={inputCls} placeholder="Master" value={prefsForm.targetDegreeLevel} onChange={(e) => setPrefsForm((f) => ({ ...f, targetDegreeLevel: e.target.value }))} />
            </Field>
            <Field label="Fields of interest">
              <input className={inputCls} placeholder="Computer Science, AI" value={prefsForm.fieldsOfInterest} onChange={(e) => setPrefsForm((f) => ({ ...f, fieldsOfInterest: e.target.value }))} />
            </Field>
            <Field label="Preferred countries">
              <input className={inputCls} placeholder="Germany, Netherlands" value={prefsForm.preferredCountries} onChange={(e) => setPrefsForm((f) => ({ ...f, preferredCountries: e.target.value }))} />
            </Field>
            <Field label="Preferred languages">
              <input className={inputCls} placeholder="English, French" value={prefsForm.preferredLanguages} onChange={(e) => setPrefsForm((f) => ({ ...f, preferredLanguages: e.target.value }))} />
            </Field>
            <Field label="Study modes">
              <input className={inputCls} placeholder="Full-time, Online" value={prefsForm.studyModes} onChange={(e) => setPrefsForm((f) => ({ ...f, studyModes: e.target.value }))} />
            </Field>
          </div>
          {prefsMsg && (
            <p className={`text-sm ${prefsMsg.ok ? 'text-brand-700' : 'text-red-600'}`}>{prefsMsg.text}</p>
          )}
          <button type="submit" disabled={prefsSaving} className={btnPrimary}>
            {prefsSaving ? 'Saving…' : 'Save preferences'}
          </button>
        </form>
      </Section>

      {/* ── Budget ── */}
      <Section title="Budget">
        <form onSubmit={saveBudget} className="space-y-4">
          <p className="text-xs text-slate-400">
            Your budget helps filter and rank opportunities by funding coverage.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount *">
              <input required type="number" min="0" step="0.01" className={inputCls} placeholder="12000" value={budgetForm.amount} onChange={(e) => setBudgetForm((f) => ({ ...f, amount: e.target.value }))} />
            </Field>
            <Field label="Currency *">
              <input required className={inputCls} placeholder="EUR" maxLength={3} value={budgetForm.currency} onChange={(e) => setBudgetForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))} />
            </Field>
            <Field label="Period *">
              <select className={inputCls} value={budgetForm.period} onChange={(e) => setBudgetForm((f) => ({ ...f, period: e.target.value as BudgetPeriod }))}>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="TOTAL">Total (one-time)</option>
              </select>
            </Field>
            <Field label="Scope *">
              <select className={inputCls} value={budgetForm.scope} onChange={(e) => setBudgetForm((f) => ({ ...f, scope: e.target.value as BudgetScope }))}>
                <option value="TUITION_ONLY">Tuition only</option>
                <option value="LIVING_ONLY">Living only</option>
                <option value="TOTAL_COST">Total cost (tuition + living)</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
          </div>
          {budgetMsg && (
            <p className={`text-sm ${budgetMsg.ok ? 'text-brand-700' : 'text-red-600'}`}>{budgetMsg.text}</p>
          )}
          <button type="submit" disabled={budgetSaving} className={btnPrimary}>
            {budgetSaving ? 'Saving…' : 'Save budget'}
          </button>
        </form>
      </Section>
    </main>
  );
}
