"use client";

import { useEffect, useRef, useState } from "react";
import DosSelect from "@/components/ui/DosSelect";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId =
  | "colly"
  | "crew"
  | "artist"
  | "bbs"
  | "app"
  | "mag"
  | "request"
  | "sitelogo";

interface Status {
  msg: string;
  ok: boolean;
}

interface SubmitClientProps {
  artistList: string[];
  crewList: string[];
  bbsList: string[];
}

const TABS: { id: TabId; label: string }[] = [
  { id: "colly",    label: "COLLY" },
  { id: "crew",     label: "CREW" },
  { id: "artist",   label: "ARTiST" },
  { id: "bbs",      label: "BBS" },
  { id: "app",      label: "APP" },
  { id: "mag",      label: "MAG" },
  { id: "request",  label: "REQUEST" },
  { id: "sitelogo", label: "LOGO" },
];

const VALID_HASHES = [
  "colly",
  "crew",
  "artist",
  "bbs",
  "app",
  "mag",
  "ascii_mag",
  "request",
  "sitelogo",
];

// ─── Multi-select field helpers ───────────────────────────────────────────────

function updateField(fields: string[], idx: number, value: string): string[] {
  const copy = [...fields];
  copy[idx] = value;
  return copy;
}

function addField(fields: string[]): string[] {
  return [...fields, ""];
}

function removeField(fields: string[], idx: number): string[] {
  if (fields.length <= 1) return [""];
  return fields.filter((_, i) => i !== idx);
}

// ─── Reusable field row ───────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="amb-1">
      <div className="lightgrey amb-1">
        {label} {required && <span className="red">*</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubmitClient({ artistList, crewList, bbsList }: SubmitClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("colly");
  const [status, setStatus] = useState<Status | null>(null);

  // Colly form
  const collyFileRef = useRef<HTMLInputElement>(null);
  const [collyName, setCollyName] = useState("");
  const [collyYear, setCollyYear] = useState("");
  const [collyMonth, setCollyMonth] = useState("");
  const [collyDay, setCollyDay] = useState("");
  const [collyArtists, setCollyArtists] = useState<string[]>([""]);
  const [collyCrews, setCollyCrews] = useState<string[]>([""]);

  // Crew form
  const [crewName, setCrewName] = useState("");
  const [crewAcronym, setCrewAcronym] = useState("");
  const [crewWebsite, setCrewWebsite] = useState("");
  const [crewContact, setCrewContact] = useState("");
  const [crewActive, setCrewActive] = useState("");
  const [crewBbses, setCrewBbses] = useState<string[]>([""]);

  // Artist form
  const [artistNick, setArtistNick] = useState("");
  const [artistAcronym, setArtistAcronym] = useState("");
  const [artistWebsite, setArtistWebsite] = useState("");
  const [artistCountry, setArtistCountry] = useState("");
  const [artistActive, setArtistActive] = useState("");
  const [artistCrews, setArtistCrews] = useState<string[]>([""]);

  // BBS form
  const [bbsName, setBbsName] = useState("");
  const [bbsAddress, setBbsAddress] = useState("");
  const [bbsSysop, setBbsSysop] = useState("");
  const [bbsNumber, setBbsNumber] = useState("");
  const [bbsCountry, setBbsCountry] = useState("");
  const [bbsSoftware, setBbsSoftware] = useState("");
  const [bbsOnline, setBbsOnline] = useState(false);

  // App form
  const appFileRef = useRef<HTMLInputElement>(null);
  const [appName, setAppName] = useState("");
  const [appAuthor, setAppAuthor] = useState("");
  const [appYear, setAppYear] = useState("");
  const [appMonth, setAppMonth] = useState("");
  const [appDay, setAppDay] = useState("");

  // Mag form
  const magFileRef = useRef<HTMLInputElement>(null);
  const [magName, setMagName] = useState("");
  const [magAuthor, setMagAuthor] = useState("");
  const [magYear, setMagYear] = useState("");
  const [magMonth, setMagMonth] = useState("");
  const [magDay, setMagDay] = useState("");

  // Request form
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");

  // Site logo form
  const [logoAuthor, setLogoAuthor] = useState("");
  const [logoAscii, setLogoAscii] = useState("");

  // ── Hash sync ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const fromHash = (window.location.hash || "").replace(/^#/, "");
    if (VALID_HASHES.includes(fromHash)) {
      setActiveTab(fromHash === "ascii_mag" ? "mag" : (fromHash as TabId));
    }
    const onHash = () => {
      const h = (window.location.hash || "").replace(/^#/, "");
      if (VALID_HASHES.includes(h)) setActiveTab(h === "ascii_mag" ? "mag" : (h as TabId));
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    history.replaceState(null, "", `#${id}`);
  };

  // ── Status auto-dismiss ────────────────────────────────────────────────────

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(t);
  }, [status]);

  // ── Submit handlers ────────────────────────────────────────────────────────

  async function handleCollySubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const fileInput = collyFileRef.current;
    if (!fileInput?.files?.[0]) {
      setStatus({ msg: "Please select a file.", ok: false });
      return;
    }
    const formData = new FormData();
    formData.append("filename", fileInput.files[0]);
    formData.append("name", collyName);
    formData.append("year", collyYear);
    formData.append("month", collyMonth);
    formData.append("day", collyDay);
    collyArtists.filter(Boolean).forEach((a) => formData.append("artistname[]", a));
    collyCrews.filter(Boolean).forEach((c) => formData.append("crewname[]", c));

    const r = await fetch("/api/collys", { method: "POST", body: formData });
    if (r.status === 409) {
      setStatus({ msg: "A colly with that name or filename already exists.", ok: false });
    } else if (r.status === 201) {
      setStatus({ msg: "Colly uploaded successfully!", ok: true });
      setCollyName(""); setCollyYear(""); setCollyMonth(""); setCollyDay("");
      setCollyArtists([""]); setCollyCrews([""]);
      if (collyFileRef.current) collyFileRef.current.value = "";
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setStatus({ msg: body.error ?? "Upload failed.", ok: false });
    }
  }

  async function handleCrewSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const r = await fetch("/api/crews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: crewName, acronym: crewAcronym, www: crewWebsite,
        contact: crewContact, active: crewActive,
        bbsname: crewBbses.filter(Boolean),
      }),
    });
    if (r.status === 409) setStatus({ msg: "A crew with that name already exists.", ok: false });
    else if (r.status === 201) {
      setStatus({ msg: "Crew added successfully!", ok: true });
      setCrewName(""); setCrewAcronym(""); setCrewWebsite("");
      setCrewContact(""); setCrewActive(""); setCrewBbses([""]);
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setStatus({ msg: body.error ?? "Submit failed.", ok: false });
    }
  }

  async function handleArtistSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const r = await fetch("/api/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nick: artistNick, acronym: artistAcronym, www: artistWebsite,
        country: artistCountry, active: artistActive,
        crewname: artistCrews.filter(Boolean),
      }),
    });
    if (r.status === 409) setStatus({ msg: "An artist with that nick already exists.", ok: false });
    else if (r.status === 201) {
      setStatus({ msg: "Artist added successfully!", ok: true });
      setArtistNick(""); setArtistAcronym(""); setArtistWebsite("");
      setArtistCountry(""); setArtistActive(""); setArtistCrews([""]);
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setStatus({ msg: body.error ?? "Submit failed.", ok: false });
    }
  }

  async function handleBbsSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const r = await fetch("/api/bbs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: bbsName, address: bbsAddress, sysop: bbsSysop, number: bbsNumber,
        country: bbsCountry, software: bbsSoftware, online: bbsOnline,
      }),
    });
    if (r.status === 409) setStatus({ msg: "A BBS with that name already exists.", ok: false });
    else if (r.status === 201) {
      setStatus({ msg: "BBS added successfully!", ok: true });
      setBbsName(""); setBbsAddress(""); setBbsSysop(""); setBbsNumber("");
      setBbsCountry(""); setBbsSoftware(""); setBbsOnline(false);
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setStatus({ msg: body.error ?? "Submit failed.", ok: false });
    }
  }

  async function handleAppSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const fileInput = appFileRef.current;
    if (!fileInput?.files?.[0]) {
      setStatus({ msg: "Please select a file.", ok: false });
      return;
    }
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("name", appName);
    formData.append("author", appAuthor);
    formData.append("year", appYear);
    formData.append("month", appMonth);
    formData.append("day", appDay);

    const r = await fetch("/api/apps", { method: "POST", body: formData });
    if (r.status === 409) setStatus({ msg: "An app with that name or filename already exists.", ok: false });
    else if (r.status === 201) {
      setStatus({ msg: "App uploaded successfully!", ok: true });
      setAppName(""); setAppAuthor(""); setAppYear(""); setAppMonth(""); setAppDay("");
      if (appFileRef.current) appFileRef.current.value = "";
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setStatus({ msg: body.error ?? "Upload failed.", ok: false });
    }
  }

  async function handleMagSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const fileInput = magFileRef.current;
    if (!fileInput?.files?.[0]) {
      setStatus({ msg: "Please select a file.", ok: false });
      return;
    }
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("name", magName);
    formData.append("author", magAuthor);
    formData.append("year", magYear);
    formData.append("month", magMonth);
    formData.append("day", magDay);

    const r = await fetch("/api/mags", { method: "POST", body: formData });
    if (r.status === 409) setStatus({ msg: "A mag with that name or filename already exists.", ok: false });
    else if (r.status === 201) {
      setStatus({ msg: "Mag uploaded successfully!", ok: true });
      setMagName(""); setMagAuthor(""); setMagYear(""); setMagMonth(""); setMagDay("");
      if (magFileRef.current) magFileRef.current.value = "";
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setStatus({ msg: body.error ?? "Upload failed.", ok: false });
    }
  }

  async function handleRequestSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!requestTitle.trim()) {
      setStatus({ msg: "Title is required.", ok: false });
      return;
    }
    const r = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: requestTitle, description: requestDescription }),
    });
    if (r.status === 201) {
      setStatus({ msg: "Request submitted successfully!", ok: true });
      setRequestTitle(""); setRequestDescription("");
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setStatus({ msg: body.error ?? "Submit failed.", ok: false });
    }
  }

  async function handleLogoSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!logoAscii.trim()) {
      setStatus({ msg: "ASCII art is required.", ok: false });
      return;
    }
    const r = await fetch("/api/logos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: logoAuthor, ascii: logoAscii }),
    });
    if (r.status === 201) {
      setStatus({ msg: "Logo submitted successfully!", ok: true });
      setLogoAuthor(""); setLogoAscii("");
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setStatus({ msg: body.error ?? "Submit failed.", ok: false });
    }
  }

  // ── Multi-select renderer ─────────────────────────────────────────────────

  function MultiSelect({
    label, values, options, placeholder, onChange,
  }: {
    label: string;
    values: string[];
    options: string[];
    placeholder: string;
    onChange: (next: string[]) => void;
  }) {
    return (
      <Field label={label}>
        {values.map((val, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }} className="amb-1">
            <DosSelect
              width={240}
              value={val}
              placeholder={placeholder}
              options={[{ value: "", label: placeholder }, ...options.map(o => ({ value: o, label: o }))]}
              onChange={v => onChange(updateField(values, i, v))}
            />
            {values.length > 1 && (
              <input
                type="button"
                className="btn-big"
                value="X"
                onClick={() => onChange(removeField(values, i))}
              />
            )}
          </div>
        ))}
        <input
          type="button"
          className="btn-big"
          value={`+ Add ${label.replace(/\(s\)$/, "")}`}
          onClick={() => onChange(addField(values))}
        />
      </Field>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Horizontal tab bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          background: "#000000",
          height: "16px",
          lineHeight: "16px",
          marginBottom: "16px",
        }}
      >
        {TABS.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              style={{
                background: isActive ? "#212121" : "transparent",
                color: isActive ? "#ffff55" : "#aaaaaa",
                border: 0,
                padding: "0 16px",
                height: "16px",
                lineHeight: "16px",
                fontSize: "16px",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {status && (
        <div
          className={`bs-component quick-alert animate__animated ${
            status.ok ? "animate__bounceIn alert alert-success" : "animate__shakeX alert alert-warning"
          }`}
        >
          {status.msg}
        </div>
      )}

      {/* ── Colly ── */}
      {activeTab === "colly" && (
        <>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">UPLOAD COLLY</h2>
          </div>
          <form onSubmit={handleCollySubmit} className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <Field label="File" required>
              <input type="file" ref={collyFileRef} required className="form-control w-100" />
            </Field>
            <Field label="Name">
              <input
                type="text" className="form-control w-100"
                value={collyName} onChange={e => setCollyName(e.target.value)}
                placeholder="Collection name"
              />
            </Field>
            <Field label="Released">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input type="number" className="form-control" min={1980} max={2100} placeholder="YYYY" style={{ width: "96px" }} value={collyYear} onChange={e => setCollyYear(e.target.value)} />
                <input type="number" className="form-control" min={1} max={12} placeholder="MM" style={{ width: "80px" }} value={collyMonth} onChange={e => setCollyMonth(e.target.value)} />
                <input type="number" className="form-control" min={1} max={31} placeholder="DD" style={{ width: "80px" }} value={collyDay} onChange={e => setCollyDay(e.target.value)} />
              </div>
            </Field>
            <MultiSelect label="Artist(s)" values={collyArtists} options={artistList} placeholder="-- Unknown --" onChange={setCollyArtists} />
            <MultiSelect label="Crew(s)" values={collyCrews} options={crewList} placeholder="-- None --" onChange={setCollyCrews} />
            <div className="amt-1">
              <input type="submit" className="btn-big bg-green white" value="Upload Colly" />
            </div>
          </form>
        </>
      )}

      {/* ── Crew ── */}
      {activeTab === "crew" && (
        <>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">SUBMiT CREW</h2>
          </div>
          <form onSubmit={handleCrewSubmit} className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <Field label="Name" required>
              <input type="text" className="form-control w-100" value={crewName} onChange={e => setCrewName(e.target.value)} placeholder="Crew name" required />
            </Field>
            <Field label="Acronym">
              <input type="text" className="form-control w-100" value={crewAcronym} onChange={e => setCrewAcronym(e.target.value)} placeholder="Acronym" />
            </Field>
            <Field label="Website">
              <input type="text" className="form-control w-100" value={crewWebsite} onChange={e => setCrewWebsite(e.target.value)} placeholder="http://..." />
            </Field>
            <Field label="Contact">
              <input type="text" className="form-control w-100" value={crewContact} onChange={e => setCrewContact(e.target.value)} placeholder="Contact info" />
            </Field>
            <Field label="Active">
              <input type="text" className="form-control w-100" value={crewActive} onChange={e => setCrewActive(e.target.value)} placeholder="e.g. yes, no, inactive" />
            </Field>
            <MultiSelect label="BBS(es)" values={crewBbses} options={bbsList} placeholder="-- None --" onChange={setCrewBbses} />
            <div className="amt-1">
              <input type="submit" className="btn-big bg-green white" value="Submit Crew" />
            </div>
          </form>
        </>
      )}

      {/* ── Artist ── */}
      {activeTab === "artist" && (
        <>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">SUBMiT ARTiST</h2>
          </div>
          <form onSubmit={handleArtistSubmit} className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <Field label="Nick" required>
              <input type="text" className="form-control w-100" value={artistNick} onChange={e => setArtistNick(e.target.value)} placeholder="Handle / nick" required />
            </Field>
            <Field label="Acronym">
              <input type="text" className="form-control w-100" value={artistAcronym} onChange={e => setArtistAcronym(e.target.value)} placeholder="Acronym" />
            </Field>
            <Field label="Website">
              <input type="text" className="form-control w-100" value={artistWebsite} onChange={e => setArtistWebsite(e.target.value)} placeholder="http://..." />
            </Field>
            <Field label="Country">
              <input type="text" className="form-control w-100" value={artistCountry} onChange={e => setArtistCountry(e.target.value)} placeholder="Country code, e.g. SE" />
            </Field>
            <Field label="Active">
              <input type="text" className="form-control w-100" value={artistActive} onChange={e => setArtistActive(e.target.value)} placeholder="e.g. yes, no, inactive" />
            </Field>
            <MultiSelect label="Crew(s)" values={artistCrews} options={crewList} placeholder="-- None --" onChange={setArtistCrews} />
            <div className="amt-1">
              <input type="submit" className="btn-big bg-green white" value="Submit Artist" />
            </div>
          </form>
        </>
      )}

      {/* ── BBS ── */}
      {activeTab === "bbs" && (
        <>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">SUBMiT BBS</h2>
          </div>
          <form onSubmit={handleBbsSubmit} className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <Field label="Name" required>
              <input type="text" className="form-control w-100" value={bbsName} onChange={e => setBbsName(e.target.value)} placeholder="BBS name" required />
            </Field>
            <Field label="Address">
              <input type="text" className="form-control w-100" value={bbsAddress} onChange={e => setBbsAddress(e.target.value)} placeholder="Telnet address" />
            </Field>
            <Field label="Sysop">
              <input type="text" className="form-control w-100" value={bbsSysop} onChange={e => setBbsSysop(e.target.value)} placeholder="Sysop nick" />
            </Field>
            <Field label="Number">
              <input type="text" className="form-control w-100" value={bbsNumber} onChange={e => setBbsNumber(e.target.value)} placeholder="Phone number (if any)" />
            </Field>
            <Field label="Country">
              <input type="text" className="form-control w-100" value={bbsCountry} onChange={e => setBbsCountry(e.target.value)} placeholder="Country code, e.g. SE" />
            </Field>
            <Field label="Software">
              <input type="text" className="form-control w-100" value={bbsSoftware} onChange={e => setBbsSoftware(e.target.value)} placeholder="e.g. Mystic, Synchronet" />
            </Field>
            <div className="form-check form-switch amb-1">
              <input
                type="checkbox" className="form-check-input" id="bbsOnline"
                checked={bbsOnline} onChange={e => setBbsOnline(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="bbsOnline">Online</label>
            </div>
            <div className="amt-1">
              <input type="submit" className="btn-big bg-green white" value="Submit BBS" />
            </div>
          </form>
        </>
      )}

      {/* ── App ── */}
      {activeTab === "app" && (
        <>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">UPLOAD APP</h2>
          </div>
          <form onSubmit={handleAppSubmit} className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <Field label="File" required>
              <input type="file" ref={appFileRef} required className="form-control w-100" />
            </Field>
            <Field label="Name">
              <input type="text" className="form-control w-100" value={appName} onChange={e => setAppName(e.target.value)} placeholder="Application name" />
            </Field>
            <Field label="Author">
              <input type="text" className="form-control w-100" value={appAuthor} onChange={e => setAppAuthor(e.target.value)} placeholder="Author / creator" />
            </Field>
            <Field label="Released">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input type="number" className="form-control" min={1980} max={2100} placeholder="YYYY" style={{ width: "96px" }} value={appYear} onChange={e => setAppYear(e.target.value)} />
                <input type="number" className="form-control" min={1} max={12} placeholder="MM" style={{ width: "80px" }} value={appMonth} onChange={e => setAppMonth(e.target.value)} />
                <input type="number" className="form-control" min={1} max={31} placeholder="DD" style={{ width: "80px" }} value={appDay} onChange={e => setAppDay(e.target.value)} />
              </div>
            </Field>
            <div className="amt-1">
              <input type="submit" className="btn-big bg-green white" value="Upload App" />
            </div>
          </form>
        </>
      )}

      {/* ── Mag ── */}
      {activeTab === "mag" && (
        <>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">UPLOAD MAG</h2>
          </div>
          <form onSubmit={handleMagSubmit} className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <Field label="File" required>
              <input type="file" ref={magFileRef} required className="form-control w-100" />
            </Field>
            <Field label="Name">
              <input type="text" className="form-control w-100" value={magName} onChange={e => setMagName(e.target.value)} placeholder="Magazine name" />
            </Field>
            <Field label="Author">
              <input type="text" className="form-control w-100" value={magAuthor} onChange={e => setMagAuthor(e.target.value)} placeholder="Author / editor" />
            </Field>
            <Field label="Released">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input type="number" className="form-control" min={1980} max={2100} placeholder="YYYY" style={{ width: "96px" }} value={magYear} onChange={e => setMagYear(e.target.value)} />
                <input type="number" className="form-control" min={1} max={12} placeholder="MM" style={{ width: "80px" }} value={magMonth} onChange={e => setMagMonth(e.target.value)} />
                <input type="number" className="form-control" min={1} max={31} placeholder="DD" style={{ width: "80px" }} value={magDay} onChange={e => setMagDay(e.target.value)} />
              </div>
            </Field>
            <div className="amt-1">
              <input type="submit" className="btn-big bg-green white" value="Upload Mag" />
            </div>
          </form>
        </>
      )}

      {/* ── Request ── */}
      {activeTab === "request" && (
        <>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">SUBMiT REQUEST</h2>
          </div>
          <form onSubmit={handleRequestSubmit} className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <Field label="Title" required>
              <input type="text" className="form-control w-100" value={requestTitle} onChange={e => setRequestTitle(e.target.value)} placeholder="What are you looking for?" required />
            </Field>
            <Field label="Description">
              <textarea
                className="form-control w-100"
                value={requestDescription}
                onChange={e => setRequestDescription(e.target.value)}
                placeholder="More details about your request..."
                rows={5}
              />
            </Field>
            <div className="amt-1">
              <input type="submit" className="btn-big bg-green white" value="Submit Request" />
            </div>
          </form>
        </>
      )}

      {/* ── Site logo ── */}
      {activeTab === "sitelogo" && (
        <>
          <div className="header col-lg-12 p-0 amb-1">
            <h2 className="ap-1 bg-header">SUBMiT LOGO</h2>
          </div>
          <form onSubmit={handleLogoSubmit} className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <Field label="Author">
              <input type="text" className="form-control w-100" value={logoAuthor} onChange={e => setLogoAuthor(e.target.value)} placeholder="Your handle" />
            </Field>
            <Field label="ASCII Art" required>
              <textarea
                className="form-control w-100"
                value={logoAscii}
                onChange={e => setLogoAscii(e.target.value)}
                placeholder="Paste your ASCII logo here..."
                rows={10}
                style={{ fontFamily: "TopazPlus_a1200, monospace", whiteSpace: "pre" }}
              />
            </Field>
            <div className="amt-1">
              <input type="submit" className="btn-big bg-green white" value="Submit Logo" />
            </div>
          </form>
        </>
      )}
    </>
  );
}
