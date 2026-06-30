"use client";

import { useEffect, useRef, useState } from "react";
import Combobox from "@/components/ui/Combobox";
import DosSelect from "@/components/ui/DosSelect";
import DatePicker from "@/components/ui/DatePicker";
import ColorSwatch from "@/components/ui/ColorSwatch";
import SoundtrackPicker from "@/components/music/SoundtrackPicker";
import AnsiEditor, { type AnsiEditorRef } from "@/components/ui/AnsiEditor/AnsiEditor";
import { FONTS } from "@/lib/ansilove";

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
  // Optional per-colly render settings (also settable via the file's invisible trailer).
  const [collyFont, setCollyFont] = useState("");
  const [collyFg, setCollyFg] = useState("");
  const [collyBg, setCollyBg] = useState("");
  const [collySoundtrack, setCollySoundtrack] = useState("");

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
  const [logoAnsiFont, setLogoAnsiFont] = useState("");
  const logoAnsiRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AnsiEditorRef>(null);

  // ── Hash sync ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const onHash = () => {
      const h = (window.location.hash || "").replace(/^#/, "");
      if (VALID_HASHES.includes(h)) {
        setActiveTab(h === "ascii_mag" ? "mag" : (h as TabId));
      }
    };

    // Next.js Link clicks that change only the hash use history.pushState,
    // which doesn't fire 'hashchange'. Wrap pushState/replaceState locally
    // so a NavBar link to /submit#bbs from /submit#colly still swaps tabs.
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = ((...args: Parameters<typeof history.pushState>) => {
      origPush.apply(history, args);
      onHash();
    }) as typeof history.pushState;
    history.replaceState = ((...args: Parameters<typeof history.replaceState>) => {
      origReplace.apply(history, args);
      onHash();
    }) as typeof history.replaceState;

    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);

    // Belt-and-braces: catch <a href="/submit#xyz"> clicks at the document
    // level. If Next.js's router intercepts the click and calls pushState
    // through a cached reference that bypasses our wrap, this listener
    // still fires synchronously on click and applies the tab change
    // directly from the href.
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const m = href.match(/^\/submit#(.+)$/);
      if (!m) return;
      const target = m[1] === "ascii_mag" ? "mag" : m[1];
      if (TABS.some(t => t.id === target)) {
        setActiveTab(target as TabId);
      }
    };
    // Capture phase so we run before Next.js's <Link> click handler, which
    // calls preventDefault() (causing a bubble-phase listener to skip via
    // e.defaultPrevented). Capture has no such gate.
    document.addEventListener("click", onClick, true);

    onHash(); // initial

    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
      document.removeEventListener("click", onClick, true);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
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
    if (collyFont) formData.append("render_font", collyFont);
    if (collyFg) formData.append("render_fg", collyFg);
    if (collyBg) formData.append("render_bg", collyBg);
    if (collySoundtrack) formData.append("soundtrack", collySoundtrack);

    const r = await fetch("/api/collys", { method: "POST", body: formData });
    if (r.status === 409) {
      setStatus({ msg: "A colly with that name or filename already exists.", ok: false });
    } else if (r.status === 201) {
      setStatus({ msg: "Colly uploaded successfully!", ok: true });
      setCollyName(""); setCollyYear(""); setCollyMonth(""); setCollyDay("");
      setCollyArtists([""]); setCollyCrews([""]);
      setCollyFont(""); setCollyFg(""); setCollyBg(""); setCollySoundtrack("");
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
    const editor = editorRef.current;
    if (!editor) {
      setStatus({ msg: "Editor is still loading — try again.", ok: false });
      return;
    }
    // A blank 80x10 export is still ~960 bytes (spaces + SAUCE), so reject an
    // all-blank canvas explicitly rather than relying on byte length.
    if (editor.isEmpty()) {
      setStatus({ msg: "Draw something before submitting.", ok: false });
      return;
    }
    const bytes = await editor.getAnsiBytes();
    if (!bytes || bytes.length === 0) {
      setStatus({ msg: "Could not read the canvas — try again.", ok: false });
      return;
    }
    // POST as multipart, same shape as the .ans upload form below.
    // Copy into a fresh ArrayBuffer-backed view so the File constructor's
    // BlobPart type is satisfied (getAnsiBytes returns a generic Uint8Array).
    const ansBuffer = new Uint8Array(bytes.length);
    ansBuffer.set(bytes);
    const fd = new FormData();
    fd.append("ans", new File([ansBuffer], "logo.ans"));
    fd.append("author", logoAuthor);
    fd.append("font", "topaz+");
    const r = await fetch("/api/logos", { method: "POST", body: fd });
    if (r.status === 201) {
      setStatus({ msg: "Logo submitted successfully!", ok: true });
      setLogoAuthor("");
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setStatus({ msg: body.error ?? "Submit failed.", ok: false });
    }
  }

  async function handleAnsiLogoSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const file = logoAnsiRef.current?.files?.[0];
    if (!file) {
      setStatus({ msg: "Choose a .ans file first.", ok: false });
      return;
    }
    const fd = new FormData();
    fd.append("ans", file);
    fd.append("author", logoAuthor);
    if (logoAnsiFont) fd.append("font", logoAnsiFont);
    const r = await fetch("/api/logos", { method: "POST", body: fd });
    if (r.status === 201) {
      setStatus({ msg: "ANSI logo submitted successfully!", ok: true });
      if (logoAnsiRef.current) logoAnsiRef.current.value = "";
    } else {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      setStatus({ msg: body.error ?? "Submit failed.", ok: false });
    }
  }

  // ── Multi-select renderer ─────────────────────────────────────────────────

  function MultiSelect({
    label, values, options, placeholder, createLabel, onChange,
  }: {
    label: string;
    values: string[];
    options: string[];
    placeholder: string;
    /** Singular noun for the "+ Create new <createLabel>" sentinel. */
    createLabel?: string;
    onChange: (next: string[]) => void;
  }) {
    return (
      <Field label={label}>
        {values.map((val, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }} className="amb-1">
            <Combobox
              width={240}
              value={val}
              placeholder={placeholder}
              createLabel={createLabel}
              options={options.map(o => ({ value: o, label: o }))}
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
          <div className="bg-secondary ap-1 amb-1 lightgrey">
            New here? <a href="/submit/test" className="magenta">Test your colly</a> to see how
            we&apos;ll read it, or read the{" "}
            <a href="/guidelines" className="magenta">colly guidelines</a>. Style freely &mdash;
            it&apos;s all optional.
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
              <DatePicker
                value={collyYear && collyMonth && collyDay
                  ? `${String(collyYear).padStart(4, "0")}-${String(collyMonth).padStart(2, "0")}-${String(collyDay).padStart(2, "0")}`
                  : ""}
                onChange={v => {
                  if (!v) { setCollyYear(""); setCollyMonth(""); setCollyDay(""); return; }
                  const [y, m, d] = v.split("-");
                  setCollyYear(String(parseInt(y))); setCollyMonth(String(parseInt(m))); setCollyDay(String(parseInt(d)));
                }}
              />
            </Field>
            <MultiSelect label="Artist(s)" values={collyArtists} options={artistList} placeholder="-- Unknown --" createLabel="artist" onChange={setCollyArtists} />
            <MultiSelect label="Crew(s)" values={collyCrews} options={crewList} placeholder="-- None --" createLabel="crew" onChange={setCollyCrews} />
            <Field label="Font">
              <DosSelect
                padded
                width={240}
                value={collyFont}
                options={[{ value: "", label: "Default / viewer choice" }, ...FONTS]}
                onChange={setCollyFont}
              />
            </Field>
            <Field label="Colours">
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <span className="lightgrey" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  text <ColorSwatch current={collyFg || "#ff55ff"} onChange={setCollyFg} />
                </span>
                <span className="lightgrey" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  background <ColorSwatch current={collyBg || "#111111"} onChange={setCollyBg} />
                </span>
                {(collyFg || collyBg) && (
                  <input type="button" className="btn-big" value="Reset colours" onClick={() => { setCollyFg(""); setCollyBg(""); }} />
                )}
              </div>
            </Field>
            <Field label="Soundtrack">
              <SoundtrackPicker value={collySoundtrack} onChange={setCollySoundtrack} />
            </Field>
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
            <MultiSelect label="BBS(es)" values={crewBbses} options={bbsList} placeholder="-- None --" createLabel="BBS" onChange={setCrewBbses} />
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
            <MultiSelect label="Crew(s)" values={artistCrews} options={crewList} placeholder="-- None --" createLabel="crew" onChange={setArtistCrews} />
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
            <Field label="Draw your logo" required>
              <div className="lightgrey amb-1" style={{ fontFamily: "TopazPlus_a1200, monospace", fontSize: "16px", lineHeight: "16px" }}>
                Draw an 80 &times; 10 ANSI logo below — the header limit. Submit exports it as a .ans file.
              </div>
              {/* The editor sits flush at full width (its header was slimmed in
                  editor.css so it no longer needs ~980px). The fixed height
                  gives the editor's height:100% chain a definite box to resolve
                  against AND fully contains the vertically-stacked sections:
                  header + palette strip + 80x10 canvas + horizontal tool bar;
                  editor.css clips overflow so nothing spills into the "Submit
                  Logo" button below. 348px = DosSelect row (24) + the editor's
                  min-height (323: header 43 + palette 64 + viewport 176 [640x160
                  canvas + 16px margins] + tool bar 40). marginBottom keeps the
                  green submit button clear of it. */}
              <div style={{ width: "100%", height: 348, marginBottom: 16 }}>
                <AnsiEditor ref={editorRef} />
              </div>
            </Field>
            <div className="amt-1">
              <input
                type="submit"
                className="btn-big bg-green white"
                value="Submit Logo"
              />
            </div>
          </form>

          <form onSubmit={handleAnsiLogoSubmit} className="container-fluid bg-secondary apb-1 ap-1 amb-2">
            <div className="lightgrey amb-1">Or upload an ANSI logo (.ans):</div>
            <Field label="ANSI file" required>
              <input ref={logoAnsiRef} type="file" accept=".ans" className="lightgrey" />
            </Field>
            <Field label="Font">
              <DosSelect
                padded
                width={240}
                value={logoAnsiFont}
                options={[{ value: "", label: "Auto (SAUCE)" }, ...FONTS]}
                onChange={setLogoAnsiFont}
              />
            </Field>
            <div className="amt-1">
              <input type="submit" className="btn-big bg-green white" value="Submit ANSI Logo" />
            </div>
          </form>
        </>
      )}
    </>
  );
}
