"use client";

import { useEffect, useRef, useState } from "react";

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

const ALL_TABS: TabId[] = [
  "colly",
  "crew",
  "artist",
  "bbs",
  "app",
  "mag",
  "request",
  "sitelogo",
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

function tabLabel(tab: TabId): string {
  if (tab === "sitelogo") return "Logo";
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

// ─── Multi-select field helpers ───────────────────────────────────────────────

function updateField(
  fields: string[],
  idx: number,
  value: string
): string[] {
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubmitClient({
  artistList,
  crewList,
  bbsList,
}: SubmitClientProps) {
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

  // ── Hash-based initial tab ─────────────────────────────────────────────────

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (VALID_HASHES.includes(hash)) {
      setActiveTab(hash === "ascii_mag" ? "mag" : (hash as TabId));
    }
  }, []);

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
    collyArtists.filter(Boolean).forEach((a) =>
      formData.append("artistname[]", a)
    );
    collyCrews.filter(Boolean).forEach((c) =>
      formData.append("crewname[]", c)
    );

    const r = await fetch("/api/collys", { method: "POST", body: formData });
    if (r.status === 409) {
      setStatus({ msg: "A colly with that name or filename already exists.", ok: false });
    } else if (r.status === 201) {
      setStatus({ msg: "Colly uploaded successfully!", ok: true });
      setCollyName("");
      setCollyYear("");
      setCollyMonth("");
      setCollyDay("");
      setCollyArtists([""]);
      setCollyCrews([""]);
      if (collyFileRef.current) collyFileRef.current.value = "";
    } else {
      const body = await r.json().catch(() => ({})) as { error?: string };
      setStatus({ msg: body.error ?? "Upload failed.", ok: false });
    }
  }

  async function handleCrewSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const r = await fetch("/api/crews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: crewName,
        acronym: crewAcronym,
        www: crewWebsite,
        contact: crewContact,
        active: crewActive,
        bbsname: crewBbses.filter(Boolean),
      }),
    });
    if (r.status === 409) {
      setStatus({ msg: "A crew with that name already exists.", ok: false });
    } else if (r.status === 201) {
      setStatus({ msg: "Crew added successfully!", ok: true });
      setCrewName("");
      setCrewAcronym("");
      setCrewWebsite("");
      setCrewContact("");
      setCrewActive("");
      setCrewBbses([""]);
    } else {
      const body = await r.json().catch(() => ({})) as { error?: string };
      setStatus({ msg: body.error ?? "Submit failed.", ok: false });
    }
  }

  async function handleArtistSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const r = await fetch("/api/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nick: artistNick,
        acronym: artistAcronym,
        www: artistWebsite,
        country: artistCountry,
        active: artistActive,
        crewname: artistCrews.filter(Boolean),
      }),
    });
    if (r.status === 409) {
      setStatus({ msg: "An artist with that nick already exists.", ok: false });
    } else if (r.status === 201) {
      setStatus({ msg: "Artist added successfully!", ok: true });
      setArtistNick("");
      setArtistAcronym("");
      setArtistWebsite("");
      setArtistCountry("");
      setArtistActive("");
      setArtistCrews([""]);
    } else {
      const body = await r.json().catch(() => ({})) as { error?: string };
      setStatus({ msg: body.error ?? "Submit failed.", ok: false });
    }
  }

  async function handleBbsSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const r = await fetch("/api/bbs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: bbsName,
        address: bbsAddress,
        sysop: bbsSysop,
        number: bbsNumber,
        country: bbsCountry,
        software: bbsSoftware,
        online: bbsOnline,
      }),
    });
    if (r.status === 409) {
      setStatus({ msg: "A BBS with that name already exists.", ok: false });
    } else if (r.status === 201) {
      setStatus({ msg: "BBS added successfully!", ok: true });
      setBbsName("");
      setBbsAddress("");
      setBbsSysop("");
      setBbsNumber("");
      setBbsCountry("");
      setBbsSoftware("");
      setBbsOnline(false);
    } else {
      const body = await r.json().catch(() => ({})) as { error?: string };
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
    if (r.status === 409) {
      setStatus({ msg: "An app with that name or filename already exists.", ok: false });
    } else if (r.status === 201) {
      setStatus({ msg: "App uploaded successfully!", ok: true });
      setAppName("");
      setAppAuthor("");
      setAppYear("");
      setAppMonth("");
      setAppDay("");
      if (appFileRef.current) appFileRef.current.value = "";
    } else {
      const body = await r.json().catch(() => ({})) as { error?: string };
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
    if (r.status === 409) {
      setStatus({ msg: "A mag with that name or filename already exists.", ok: false });
    } else if (r.status === 201) {
      setStatus({ msg: "Mag uploaded successfully!", ok: true });
      setMagName("");
      setMagAuthor("");
      setMagYear("");
      setMagMonth("");
      setMagDay("");
      if (magFileRef.current) magFileRef.current.value = "";
    } else {
      const body = await r.json().catch(() => ({})) as { error?: string };
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
      body: JSON.stringify({
        title: requestTitle,
        description: requestDescription,
      }),
    });
    if (r.status === 201) {
      setStatus({ msg: "Request submitted successfully!", ok: true });
      setRequestTitle("");
      setRequestDescription("");
    } else {
      const body = await r.json().catch(() => ({})) as { error?: string };
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
      body: JSON.stringify({
        author: logoAuthor,
        ascii: logoAscii,
      }),
    });
    if (r.status === 201) {
      setStatus({ msg: "Logo submitted successfully!", ok: true });
      setLogoAuthor("");
      setLogoAscii("");
    } else {
      const body = await r.json().catch(() => ({})) as { error?: string };
      setStatus({ msg: body.error ?? "Submit failed.", ok: false });
    }
  }

  // ── Shared field row styles ────────────────────────────────────────────────

  const fieldStyle: React.CSSProperties = { marginBottom: "10px" };
  const labelStyle: React.CSSProperties = {
    color: "#aaa",
    fontSize: "12px",
    marginBottom: "3px",
    display: "block",
  };
  const inputStyle: React.CSSProperties = { marginBottom: "0" };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="col-lg-12 bg-secondary" style={{ padding: "0" }}>
      {/* Status bar */}
      {status && (
        <div
          className={`alert alert-${status.ok ? "success" : "warning"} animate__animated animate__shakeX amt-1 aml-1 amr-1`}
          style={{ marginBottom: "4px" }}
        >
          {status.msg}
        </div>
      )}

      {/* Tab navigation */}
      <ul className="nav nav-tabs apt-1 bg-header">
        {ALL_TABS.map((tab) => (
          <li key={tab} className="nav-item">
            <a
              className={`nav-link${activeTab === tab ? " active" : ""}`}
              data-bs-toggle="tab"
              style={{ cursor: "pointer" }}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabel(tab)}
            </a>
          </li>
        ))}
      </ul>

      <div className="tab-content" style={{ padding: "16px" }}>

        {/* ── Colly tab ── */}
        {activeTab === "colly" && (
          <form onSubmit={handleCollySubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>File (required)</label>
              <input
                type="file"
                className="form-control-file"
                ref={collyFileRef}
                required
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                className="form-control"
                value={collyName}
                onChange={(e) => setCollyName(e.target.value)}
                placeholder="Collection name"
              />
            </div>
            <div className="row" style={fieldStyle}>
              <div className="col-4">
                <label style={labelStyle}>Year</label>
                <input
                  type="number"
                  className="form-control"
                  value={collyYear}
                  onChange={(e) => setCollyYear(e.target.value)}
                  placeholder="YYYY"
                  min={1980}
                  max={2100}
                />
              </div>
              <div className="col-4">
                <label style={labelStyle}>Month</label>
                <input
                  type="number"
                  className="form-control"
                  value={collyMonth}
                  onChange={(e) => setCollyMonth(e.target.value)}
                  placeholder="MM"
                  min={1}
                  max={12}
                />
              </div>
              <div className="col-4">
                <label style={labelStyle}>Day</label>
                <input
                  type="number"
                  className="form-control"
                  value={collyDay}
                  onChange={(e) => setCollyDay(e.target.value)}
                  placeholder="DD"
                  min={1}
                  max={31}
                />
              </div>
            </div>

            {/* Artists */}
            <div style={fieldStyle}>
              <div style={{ fontWeight: "bold", color: "#ccc", fontSize: "12px", marginBottom: "6px" }}>
                Artist(s)
              </div>
              {collyArtists.map((val, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                  <select
                    className="form-select"
                    value={val}
                    onChange={(e) =>
                      setCollyArtists(updateField(collyArtists, i, e.target.value))
                    }
                  >
                    <option value="">-- Unknown --</option>
                    {artistList.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  {collyArtists.length > 1 && (
                    <input
                      type="button"
                      className="btn-big"
                      value="X"
                      onClick={() => setCollyArtists(removeField(collyArtists, i))}
                    />
                  )}
                </div>
              ))}
              <input
                type="button"
                className="btn-big"
                value="+ Add Artist"
                onClick={() => setCollyArtists(addField(collyArtists))}
              />
            </div>

            {/* Crews */}
            <div style={fieldStyle}>
              <div style={{ fontWeight: "bold", color: "#ccc", fontSize: "12px", marginBottom: "6px" }}>
                Crew(s)
              </div>
              {collyCrews.map((val, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                  <select
                    className="form-select"
                    value={val}
                    onChange={(e) =>
                      setCollyCrews(updateField(collyCrews, i, e.target.value))
                    }
                  >
                    <option value="">-- None --</option>
                    {crewList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {collyCrews.length > 1 && (
                    <input
                      type="button"
                      className="btn-big"
                      value="X"
                      onClick={() => setCollyCrews(removeField(collyCrews, i))}
                    />
                  )}
                </div>
              ))}
              <input
                type="button"
                className="btn-big"
                value="+ Add Crew"
                onClick={() => setCollyCrews(addField(collyCrews))}
              />
            </div>

            <div style={{ marginTop: "12px" }}>
              <input type="button" className="btn-big" value="Upload Colly" onClick={handleCollySubmit} />
            </div>
          </form>
        )}

        {/* ── Crew tab ── */}
        {activeTab === "crew" && (
          <form onSubmit={handleCrewSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Name (required)</label>
              <input
                type="text"
                className="form-control"
                value={crewName}
                onChange={(e) => setCrewName(e.target.value)}
                placeholder="Crew name"
                required
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Acronym</label>
              <input
                type="text"
                className="form-control"
                value={crewAcronym}
                onChange={(e) => setCrewAcronym(e.target.value)}
                placeholder="Acronym"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Website</label>
              <input
                type="text"
                className="form-control"
                value={crewWebsite}
                onChange={(e) => setCrewWebsite(e.target.value)}
                placeholder="http://..."
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Contact</label>
              <input
                type="text"
                className="form-control"
                value={crewContact}
                onChange={(e) => setCrewContact(e.target.value)}
                placeholder="Contact info"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Active</label>
              <input
                type="text"
                className="form-control"
                value={crewActive}
                onChange={(e) => setCrewActive(e.target.value)}
                placeholder="e.g. yes, no, inactive"
              />
            </div>

            {/* BBS(es) */}
            <div style={fieldStyle}>
              <div style={{ fontWeight: "bold", color: "#ccc", fontSize: "12px", marginBottom: "6px" }}>
                BBS(es)
              </div>
              {crewBbses.map((val, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                  <select
                    className="form-select"
                    value={val}
                    onChange={(e) =>
                      setCrewBbses(updateField(crewBbses, i, e.target.value))
                    }
                  >
                    <option value="">-- None --</option>
                    {bbsList.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {crewBbses.length > 1 && (
                    <input
                      type="button"
                      className="btn-big"
                      value="X"
                      onClick={() => setCrewBbses(removeField(crewBbses, i))}
                    />
                  )}
                </div>
              ))}
              <input
                type="button"
                className="btn-big"
                value="+ Add BBS"
                onClick={() => setCrewBbses(addField(crewBbses))}
              />
            </div>

            <div style={{ marginTop: "12px" }}>
              <input type="button" className="btn-big" value="Submit Crew" onClick={handleCrewSubmit} />
            </div>
          </form>
        )}

        {/* ── Artist tab ── */}
        {activeTab === "artist" && (
          <form onSubmit={handleArtistSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Nick (required)</label>
              <input
                type="text"
                className="form-control"
                value={artistNick}
                onChange={(e) => setArtistNick(e.target.value)}
                placeholder="Handle / nick"
                required
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Acronym</label>
              <input
                type="text"
                className="form-control"
                value={artistAcronym}
                onChange={(e) => setArtistAcronym(e.target.value)}
                placeholder="Acronym"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Website</label>
              <input
                type="text"
                className="form-control"
                value={artistWebsite}
                onChange={(e) => setArtistWebsite(e.target.value)}
                placeholder="http://..."
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Country</label>
              <input
                type="text"
                className="form-control"
                value={artistCountry}
                onChange={(e) => setArtistCountry(e.target.value)}
                placeholder="Country code, e.g. SE"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Active</label>
              <input
                type="text"
                className="form-control"
                value={artistActive}
                onChange={(e) => setArtistActive(e.target.value)}
                placeholder="e.g. yes, no, inactive"
              />
            </div>

            {/* Crew(s) */}
            <div style={fieldStyle}>
              <div style={{ fontWeight: "bold", color: "#ccc", fontSize: "12px", marginBottom: "6px" }}>
                Crew(s)
              </div>
              {artistCrews.map((val, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                  <select
                    className="form-select"
                    value={val}
                    onChange={(e) =>
                      setArtistCrews(updateField(artistCrews, i, e.target.value))
                    }
                  >
                    <option value="">-- None --</option>
                    {crewList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {artistCrews.length > 1 && (
                    <input
                      type="button"
                      className="btn-big"
                      value="X"
                      onClick={() => setArtistCrews(removeField(artistCrews, i))}
                    />
                  )}
                </div>
              ))}
              <input
                type="button"
                className="btn-big"
                value="+ Add Crew"
                onClick={() => setArtistCrews(addField(artistCrews))}
              />
            </div>

            <div style={{ marginTop: "12px" }}>
              <input type="button" className="btn-big" value="Submit Artist" onClick={handleArtistSubmit} />
            </div>
          </form>
        )}

        {/* ── BBS tab ── */}
        {activeTab === "bbs" && (
          <form onSubmit={handleBbsSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Name (required)</label>
              <input
                type="text"
                className="form-control"
                value={bbsName}
                onChange={(e) => setBbsName(e.target.value)}
                placeholder="BBS name"
                required
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Address</label>
              <input
                type="text"
                className="form-control"
                value={bbsAddress}
                onChange={(e) => setBbsAddress(e.target.value)}
                placeholder="Telnet address"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Sysop</label>
              <input
                type="text"
                className="form-control"
                value={bbsSysop}
                onChange={(e) => setBbsSysop(e.target.value)}
                placeholder="Sysop nick"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Number</label>
              <input
                type="text"
                className="form-control"
                value={bbsNumber}
                onChange={(e) => setBbsNumber(e.target.value)}
                placeholder="Phone number (if any)"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Country</label>
              <input
                type="text"
                className="form-control"
                value={bbsCountry}
                onChange={(e) => setBbsCountry(e.target.value)}
                placeholder="Country code, e.g. SE"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Software</label>
              <input
                type="text"
                className="form-control"
                value={bbsSoftware}
                onChange={(e) => setBbsSoftware(e.target.value)}
                placeholder="e.g. Mystic, Synchronet"
              />
            </div>
            <div style={{ ...fieldStyle, display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="bbsOnline"
                checked={bbsOnline}
                onChange={(e) => setBbsOnline(e.target.checked)}
              />
              <label htmlFor="bbsOnline" style={{ ...labelStyle, marginBottom: 0 }}>
                Online
              </label>
            </div>

            <div style={{ marginTop: "12px" }}>
              <input type="button" className="btn-big" value="Submit BBS" onClick={handleBbsSubmit} />
            </div>
          </form>
        )}

        {/* ── App tab ── */}
        {activeTab === "app" && (
          <form onSubmit={handleAppSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>File (required)</label>
              <input
                type="file"
                className="form-control-file"
                ref={appFileRef}
                required
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                className="form-control"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Application name"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Author</label>
              <input
                type="text"
                className="form-control"
                value={appAuthor}
                onChange={(e) => setAppAuthor(e.target.value)}
                placeholder="Author / creator"
              />
            </div>
            <div className="row" style={fieldStyle}>
              <div className="col-4">
                <label style={labelStyle}>Year</label>
                <input
                  type="number"
                  className="form-control"
                  value={appYear}
                  onChange={(e) => setAppYear(e.target.value)}
                  placeholder="YYYY"
                  min={1980}
                  max={2100}
                />
              </div>
              <div className="col-4">
                <label style={labelStyle}>Month</label>
                <input
                  type="number"
                  className="form-control"
                  value={appMonth}
                  onChange={(e) => setAppMonth(e.target.value)}
                  placeholder="MM"
                  min={1}
                  max={12}
                />
              </div>
              <div className="col-4">
                <label style={labelStyle}>Day</label>
                <input
                  type="number"
                  className="form-control"
                  value={appDay}
                  onChange={(e) => setAppDay(e.target.value)}
                  placeholder="DD"
                  min={1}
                  max={31}
                />
              </div>
            </div>

            <div style={{ marginTop: "12px" }}>
              <input type="button" className="btn-big" value="Upload App" onClick={handleAppSubmit} />
            </div>
          </form>
        )}

        {/* ── Mag tab ── */}
        {activeTab === "mag" && (
          <form onSubmit={handleMagSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>File (required)</label>
              <input
                type="file"
                className="form-control-file"
                ref={magFileRef}
                required
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                className="form-control"
                value={magName}
                onChange={(e) => setMagName(e.target.value)}
                placeholder="Magazine name"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Author</label>
              <input
                type="text"
                className="form-control"
                value={magAuthor}
                onChange={(e) => setMagAuthor(e.target.value)}
                placeholder="Author / editor"
              />
            </div>
            <div className="row" style={fieldStyle}>
              <div className="col-4">
                <label style={labelStyle}>Year</label>
                <input
                  type="number"
                  className="form-control"
                  value={magYear}
                  onChange={(e) => setMagYear(e.target.value)}
                  placeholder="YYYY"
                  min={1980}
                  max={2100}
                />
              </div>
              <div className="col-4">
                <label style={labelStyle}>Month</label>
                <input
                  type="number"
                  className="form-control"
                  value={magMonth}
                  onChange={(e) => setMagMonth(e.target.value)}
                  placeholder="MM"
                  min={1}
                  max={12}
                />
              </div>
              <div className="col-4">
                <label style={labelStyle}>Day</label>
                <input
                  type="number"
                  className="form-control"
                  value={magDay}
                  onChange={(e) => setMagDay(e.target.value)}
                  placeholder="DD"
                  min={1}
                  max={31}
                />
              </div>
            </div>

            <div style={{ marginTop: "12px" }}>
              <input type="button" className="btn-big" value="Upload Mag" onClick={handleMagSubmit} />
            </div>
          </form>
        )}

        {/* ── Request tab ── */}
        {activeTab === "request" && (
          <form onSubmit={handleRequestSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Title (required)</label>
              <input
                type="text"
                className="form-control"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                placeholder="What are you looking for?"
                required
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <textarea
                className="form-control"
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                placeholder="More details about your request..."
                rows={5}
              />
            </div>

            <div style={{ marginTop: "12px" }}>
              <input type="button" className="btn-big" value="Submit Request" onClick={handleRequestSubmit} />
            </div>
          </form>
        )}

        {/* ── Site Logo tab ── */}
        {activeTab === "sitelogo" && (
          <form onSubmit={handleLogoSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Author</label>
              <input
                type="text"
                className="form-control"
                value={logoAuthor}
                onChange={(e) => setLogoAuthor(e.target.value)}
                placeholder="Your handle"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>ASCII Art (required)</label>
              <textarea
                className="form-control"
                value={logoAscii}
                onChange={(e) => setLogoAscii(e.target.value)}
                placeholder="Paste your ASCII logo here..."
                rows={10}
                style={{ fontFamily: "TopazPlus_a1200, monospace", fontSize: "13px" }}
              />
            </div>

            <div style={{ marginTop: "12px" }}>
              <input type="button" className="btn-big" value="Submit Logo" onClick={handleLogoSubmit} />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
