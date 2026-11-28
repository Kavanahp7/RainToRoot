import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api";

const today = () => new Date().toISOString().slice(0, 10);

function Notice({ error, children }) {
  return error ? <p className="rt-error-msg" role="alert">{error}</p> : children;
}

export function SoilHealth() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ report_date: today(), source: "manual", soil_type: "", ph: "", nitrogen: "", phosphorus: "", potassium: "", notes: "" });
  const load = useCallback(async () => { try { setReports((await apiFetch("/api/soil-reports")).reports); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  async function save(event) {
    event.preventDefault(); setSaving(true); setError("");
    try { await apiFetch("/api/soil-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); await load(); setForm({ ...form, ph: "", nitrogen: "", phosphorus: "", potassium: "", notes: "" }); }
    catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  return <><h1>Soil Health & Testing</h1><p className="rt-muted">Enter laboratory results or clearly labelled manual observations. A soil type alone is not a laboratory test.</p><Notice error={error} />
    <form onSubmit={save} className="rt-card" style={{ marginTop: 20 }}><div className="rt-profile-grid">
      {[['Report date', 'report_date', 'date'], ['Soil type', 'soil_type', 'text'], ['pH (0–14)', 'ph', 'number'], ['Nitrogen', 'nitrogen', 'number'], ['Phosphorus', 'phosphorus', 'number'], ['Potassium', 'potassium', 'number']].map(([label, key, type]) => <div key={key}><label className="rt-label">{label}</label><input className="rt-input" type={type} step={type === 'number' ? '0.01' : undefined} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>)}
      <div><label className="rt-label">Data source</label><select className="rt-input" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}><option value="manual">Manual entry / estimate</option><option value="laboratory">Laboratory report</option></select></div>
    </div><label className="rt-label">Notes</label><textarea className="rt-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /><button className="rt-btn" disabled={saving}>{saving ? 'Saving...' : 'Save soil report'}</button></form>
    <h2 className="rt-heading" style={{ marginTop: 28 }}>Previous soil reports</h2><div className="rt-grid">{reports.map(r => <article className="rt-card" key={r.id}><h3>{r.report_date} · {r.source}</h3><p>{r.soil_type || 'Soil type not recorded'}</p><p>pH: {r.ph ?? 'Not entered'} · N/P/K: {r.nitrogen ?? '—'} / {r.phosphorus ?? '—'} / {r.potassium ?? '—'}</p></article>)}{!reports.length && <p className="rt-muted">No soil reports yet.</p>}</div></>;
}

export function CropRecommendation() {
  const [season, setSeason] = useState("Kharif"); const [data, setData] = useState(null); const [error, setError] = useState(""); const [saving, setSaving] = useState(""); const [savedCrop, setSavedCrop] = useState("");
  const load = useCallback(async () => { try { setError(""); setData(await apiFetch(`/api/crop-recommendations?season=${encodeURIComponent(season)}`)); } catch (e) { setError(e.message); } }, [season]);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  async function select(crop) { setSaving(crop.crop_name); setError(""); setSavedCrop(""); try { await apiFetch('/api/selected-crop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...crop, soil_report_id: data.soil_report?.id }) }); setSavedCrop(crop.crop_name); } catch (e) { setError(e.message); } finally { setSaving(''); } }
  return <><h1>Smart Crop Recommendation</h1><p className="rt-muted">Recommendations use your newest saved soil report and transparent general rules. Verify the decision with your KVK.</p><label className="rt-label">Growing season</label><select className="rt-input" value={season} onChange={e => setSeason(e.target.value)}><option>Kharif</option><option>Rabi</option><option>Zaid</option><option>All</option></select><Notice error={error} />
    {!data?.soil_report && <div className="rt-result">Save a soil report with a supported soil type first to see connected recommendations.</div>}{savedCrop && <div className="rt-result" role="status">{savedCrop} is now your active crop. You can add observations in Crop Growth & Farm Management.</div>}<div className="rt-grid">{data?.recommendations?.map(crop => <article className="rt-card" key={crop.crop_name}><h3>{crop.crop_name}</h3><p>{crop.reason}</p><p><strong>Water:</strong> {crop.water_requirement}</p><p><strong>Duration:</strong> about {crop.growing_duration_days} days</p><button className="rt-btn" onClick={() => select(crop)} disabled={Boolean(saving)}>{saving === crop.crop_name ? 'Saving...' : savedCrop === crop.crop_name ? 'Selected' : 'Select crop'}</button></article>)}</div></>;
}

export function CropGrowth() {
  const [crop, setCrop] = useState(null); const [records, setRecords] = useState([]); const [error, setError] = useState(""); const [saved, setSaved] = useState(""); const [saving, setSaving] = useState(false); const [form, setForm] = useState({ record_date: today(), growth_stage: "Sowing", progress_percent: "", notes: "", irrigation_note: "", nutrient_note: "" });
  const load = useCallback(async () => { try { const [selected, saved] = await Promise.all([apiFetch('/api/selected-crop'), apiFetch('/api/crop-records')]); setCrop(selected.selected_crop); setRecords(saved.records); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  async function save(e) { e.preventDefault(); if (saving) return; setSaving(true); setError(""); setSaved(""); try { await apiFetch('/api/crop-records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, selected_crop_id: crop?.id }) }); await load(); setSaved("Farm record saved."); setForm({ ...form, progress_percent: "", notes: "", irrigation_note: "", nutrient_note: "" }); } catch (e) { setError(e.message); } finally { setSaving(false); } }
  return <><h1>Crop Growth & Farm Management</h1><p className="rt-muted">{crop ? `Active crop: ${crop.crop_name} (${crop.season}).` : 'Choose a crop in Smart Crop Recommendation to connect this record.'}</p><Notice error={error} />
    <div className="rt-result"><h3>General growth stages</h3><p>Sowing → Germination → Vegetative growth → Flowering/fruiting → Harvest. Observe your field and consult local experts for crop-specific treatment decisions.</p></div>
    {saved && <p className="rt-result" role="status">{saved}</p>}<form onSubmit={save} className="rt-card"><div className="rt-profile-grid">{[['Record date', 'record_date', 'date'], ['Growth stage', 'growth_stage', 'text'], ['Progress %', 'progress_percent', 'number']].map(([label, key, type]) => <div key={key}><label className="rt-label">{label}</label><input className="rt-input" type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required /></div>)}</div>{[['Irrigation observation', 'irrigation_note'], ['Nutrient observation', 'nutrient_note'], ['Farm note', 'notes']].map(([label, key]) => <div key={key}><label className="rt-label">{label}</label><textarea className="rt-input" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>)}<button className="rt-btn" disabled={!crop || saving}>{saving ? 'Saving...' : 'Save farm record'}</button></form>
    <div className="rt-grid">{records.map(r => <article className="rt-card" key={r.id}><h3>{r.growth_stage} · {r.record_date}</h3><p>{r.notes || 'No note recorded.'}</p></article>)}</div></>;
}

export function KnowledgeHub({ safety = false }) {
  const [articles, setArticles] = useState([]); const [error, setError] = useState(""); useEffect(() => { apiFetch('/api/knowledge').then(x => setArticles(x.articles)).catch(e => setError(e.message)); }, []); const view = safety ? articles.filter(x => x.id === 'pesticide-safety') : articles;
  return <><h1>{safety ? 'Pesticide Safety & Awareness' : 'Farmer Knowledge Hub'}</h1><Notice error={error} /><div className="rt-grid">{view.map(a => <article className="rt-card" key={a.id}><h3>{a.title}</h3><span className="rt-status">{a.topic}</span><p>{a.summary}</p></article>)}</div>{safety && <p className="rt-note">For a suspected pest or disease, seek diagnosis from a KVK or local agriculture officer. This resource intentionally does not provide chemical dosage instructions.</p>}</>;
}

export function FarmingAlerts() { return <><h1>Farming Alerts & Reminders</h1><p className="rt-muted">This page provides informational guidance only. It does not send real-time notifications or official warnings.</p><div className="rt-result"><h3>Forecast information</h3><p>Use Weather & Rainfall to view the current seven-day forecast. This page does not create alerts or predict weather conditions.</p></div><div className="rt-result"><h3>Crop record reminders</h3><p>Save an active crop and farm records to keep a dated record of sowing, irrigation and growth observations. These are records, not automated reminders.</p></div></>; }

export function SearchModule() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(e) {
    e.preventDefault();
    const trimmed = query.trim();
    setError("");

    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setError("Please enter a search term (for example: red soil, irrigation, or millet).");
      return;
    }

    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      setError("Please enter at least 2 characters to search.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      setResults(Array.isArray(data.results) ? data.results : []);
      setSearched(true);
    } catch (err) {
      setResults([]);
      setSearched(false);
      setError(err.message || "Unable to search farming resources right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1>Search farming resources</h1>
      <form onSubmit={search} className="rt-chatrow">
        <input
          className="rt-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Try red soil, irrigation or millet"
        />
        <button type="submit" className="rt-btn" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      <Notice error={error} />
      {loading && <p className="rt-muted">Searching farming resources...</p>}
      {!loading && !error && searched && results.length === 0 && (
        <div className="rt-result" role="status">
          No matching farming resources found for &ldquo;{query.trim()}&rdquo;. Try keywords like red soil, irrigation, rice, or millet.
        </div>
      )}
      <div className="rt-grid">
        {results.map(r => (
          <article className="rt-card" key={r.id}>
            <h3>{r.title}</h3>
            <span className="rt-status">{r.topic}</span>
            <p>{r.summary}</p>
          </article>
        ))}
      </div>
    </>
  );
}
