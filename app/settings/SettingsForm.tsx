"use client";

import React, { useEffect, useState, useCallback, useActionState } from "react";
import { saveSettings, changePassword, type Settings } from "@/app/actions/settings";
import LiveFeedSettings from "./LiveFeedSettings";
import WidgetSettings from "./WidgetSettings";

interface ArtistHandle {
  id: number;
  nick: string;
  artisturl: string;
}

const COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Custom" },
  { value: "#555555", label: "Bright Black" },
  { value: "#5555ff", label: "Bright Blue" },
  { value: "#ff55ff", label: "Bright Magenta" },
  { value: "#ff5555", label: "Bright Red" },
  { value: "#ffff55", label: "Bright Yellow" },
  { value: "#55ff55", label: "Bright Green" },
  { value: "#55FFFF", label: "Bright Cyan" },
  { value: "#ffffff", label: "White" },
  { value: "#000000", label: "Black" },
  { value: "#0000aa", label: "Blue" },
  { value: "#aa00aa", label: "Magenta" },
  { value: "#aa0000", label: "Red" },
  { value: "#aa5500", label: "Yellow" },
  { value: "#00aa00", label: "Green" },
  { value: "#00aaaa", label: "Cyan" },
  { value: "#aaaaaa", label: "Grey" },
];

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "MicroKnight", label: "MicroKnight" },
  { value: "MicroKnightPlus", label: "MicroKnight+" },
  { value: "mOsOul", label: "mOsOul" },
  { value: "P0T-NOoDLE", label: "P0T-NOoDLE" },
  { value: "Topaz_a500", label: "A500 Topaz" },
  { value: "TopazPlus_a500", label: "A500 Topaz+" },
  { value: "Topaz_a1200", label: "A1200 Topaz" },
  { value: "TopazPlus_a1200", label: "A1200 Topaz+" },
];

const EMPTY_SETTINGS: Settings = {
  nick: "",
  crew: "",
  byear: null,
  bmonth: null,
  bday: null,
  country: "",
  mail: "",
  webpage: "",
  upload_signature: "",
  viewmode: 0,
  def_bg_col: "",
  def_fg_col: "",
  display_mail: 0,
  def_font: null,
  crt_effect: 0,
  anim_effect: 0,
};

type TabId =
  | "profile"
  | "site"
  | "password"
  | "artist"
  | "feed"
  | "widgets";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile",  label: "PROFiLE" },
  { id: "site",     label: "SiTE" },
  { id: "password", label: "PASSWORD" },
  { id: "artist",   label: "ARTiST" },
  { id: "feed",     label: "LiVE FEED" },
  { id: "widgets",  label: "WiDGETS" },
];

interface SettingsFormProps {
  initialSettings: Settings | null;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState<Settings>(initialSettings ?? EMPTY_SETTINGS);
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Sync active tab with URL hash so reload + back/forward preserve it.
  useEffect(() => {
    const fromHash = (window.location.hash || "").replace(/^#/, "");
    if (TABS.some(t => t.id === fromHash)) setActiveTab(fromHash as TabId);
    const onHash = () => {
      const h = (window.location.hash || "").replace(/^#/, "");
      if (TABS.some(t => t.id === h)) setActiveTab(h as TabId);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `#${id}`);
    }
  };

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  useEffect(() => { setCurrentYear(new Date().getFullYear()); }, []);

  const [saveState, saveAction, savePending] = useActionState(saveSettings, { success: false });
  const [pwState, pwAction, pwPending] = useActionState(changePassword, { success: false });

  const [alertMsg, setAlertMsg] = useState<{ text: string; success: boolean } | null>(null);

  const [linkedArtists, setLinkedArtists] = useState<ArtistHandle[]>([]);
  const [suggestedArtists, setSuggestedArtists] = useState<ArtistHandle[]>([]);
  const [claimNick, setClaimNick] = useState("");
  const [artistMsg, setArtistMsg] = useState<{ text: string; success: boolean } | null>(null);

  const loadArtists = useCallback(async () => {
    try {
      const d = await (await fetch("/api/settings/artist")).json() as { linked: ArtistHandle[]; suggested: ArtistHandle[] };
      setLinkedArtists(d.linked ?? []);
      setSuggestedArtists(d.suggested ?? []);
    } catch {}
  }, []);

  useEffect(() => { loadArtists(); }, [loadArtists]);

  useEffect(() => {
    if (saveState.success) showAlert("Settings saved successfully!", true);
    else if (saveState.error) showAlert(saveState.error, false);
  }, [saveState]);

  useEffect(() => {
    if (pwState.success) showAlert("Password changed successfully!", true);
    else if (pwState.error) showAlert(pwState.error, false);
  }, [pwState]);

  function showAlert(text: string, success: boolean) {
    setAlertMsg({ text, success });
    setTimeout(() => setAlertMsg(null), 3000);
    window.scrollTo(0, 0);
  }

  function showArtistMsg(text: string, success: boolean) {
    setArtistMsg({ text, success });
    setTimeout(() => setArtistMsg(null), 3000);
  }

  async function claimArtist(nick: string) {
    const r = await fetch("/api/settings/artist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nick }),
    });
    const d = await r.json() as { error?: string };
    if (r.ok) { showArtistMsg(`Claimed '${nick}'!`, true); setClaimNick(""); loadArtists(); }
    else showArtistMsg(d.error ?? "Failed to claim.", false);
  }

  async function unclaimArtist(id: number, nick: string) {
    const r = await fetch(`/api/settings/artist/${id}`, { method: "DELETE" });
    if (r.ok) { showArtistMsg(`Unlinked '${nick}'.`, true); loadArtists(); }
    else showArtistMsg("Failed to unlink.", false);
  }

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  // crt_effect / anim_effect are display-layer flags that should take effect
  // the instant the toggle flips, not on Save. POST to the small auto-save
  // endpoint which updates the DB and broadcasts on user:{id}:profile —
  // SiteLayout subscribes and router.refresh picks up the new value.
  async function autoSaveDisplay(patch: { crt_effect?: number; anim_effect?: number }) {
    try {
      await fetch("/api/settings/display", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch { /* swallow — the next full Save will reconcile */ }
  }

  // -- Panel renderers ------------------------------------------------------

  const hiddenFields = (
    <>
      <input type="hidden" name="nick" value={settings.nick ?? ""} />
      <input type="hidden" name="crew" value={settings.crew ?? ""} />
      <input type="hidden" name="byear" value={settings.byear ?? ""} />
      <input type="hidden" name="bmonth" value={settings.bmonth ?? ""} />
      <input type="hidden" name="bday" value={settings.bday ?? ""} />
      <input type="hidden" name="country" value={settings.country ?? ""} />
      <input type="hidden" name="mail" value={settings.mail ?? ""} />
      <input type="hidden" name="webpage" value={settings.webpage ?? ""} />
      <input type="hidden" name="upload_signature" value={settings.upload_signature ?? ""} />
      <input type="hidden" name="viewmode" value={settings.viewmode ?? 0} />
      <input type="hidden" name="def_bg_col" value={settings.def_bg_col ?? ""} />
      <input type="hidden" name="def_fg_col" value={settings.def_fg_col ?? ""} />
      <input type="hidden" name="display_mail" value={settings.display_mail ?? 0} />
      <input type="hidden" name="def_font" value={settings.def_font ?? ""} />
      <input type="hidden" name="crt_effect" value={settings.crt_effect ?? 0} />
      <input type="hidden" name="anim_effect" value={settings.anim_effect ?? 0} />
    </>
  );

  const profilePanel = (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">PROFiLE</h2>
      </div>

      <div className="row apt-1"><div className="col-12">Nick</div></div>
      <div className="row amb-1">
        <div className="col-xs-12 col-md-8">
          <input
            type="text" className="form-control w-100" maxLength={14}
            value={settings.nick ?? ""} onChange={(e) => set("nick", e.target.value)}
          />
        </div>
      </div>

      <div className="row amb-1"><div className="col-12">Crew</div></div>
      <div className="row amb-1">
        <div className="col-xs-12 col-md-8">
          <input
            type="text" className="form-control w-100"
            value={settings.crew ?? ""} onChange={(e) => set("crew", e.target.value)}
          />
        </div>
      </div>

      <div className="row apt-1"><div className="col-12">Birth</div></div>
      <div className="row amb-1">
        <div className="col-4 col-md-3 apt-1">
          <select
            className="form-select w-100" value={settings.byear ?? ""}
            onChange={(e) => set("byear", e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Year</option>
            {Array.from({ length: currentYear - 5 - 1920 + 1 }, (_, i) => 1920 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="col-4 col-md-3 apt-1">
          <select
            className="form-select w-100" value={settings.bmonth ?? ""}
            onChange={(e) => set("bmonth", e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="col-4 col-md-2 apt-1">
          <select
            className="form-select w-100" value={settings.bday ?? ""}
            onChange={(e) => set("bday", e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row amb-1"><div className="col-12 apt-1">Country</div></div>
      <div className="row amb-1">
        <div className="col-xs-12 col-md-8">
          <input
            type="text" className="form-control w-100"
            value={settings.country ?? ""} onChange={(e) => set("country", e.target.value)}
          />
        </div>
      </div>

      <div className="row amb-1"><div className="col-12 apt-1">Mail</div></div>
      <div className="row amb-1">
        <div className="col-xs-12 col-md-8">
          <input
            type="email" className="form-control w-100"
            value={settings.mail ?? ""} onChange={(e) => set("mail", e.target.value)}
          />
        </div>
      </div>

      <div className="row amb-1 apt-1"><div className="col-12">Webpage</div></div>
      <div className="row amb-1">
        <div className="col-xs-12 col-md-8">
          <input
            type="url" className="form-control w-100" placeholder="https://..."
            value={settings.webpage ?? ""} onChange={(e) => set("webpage", e.target.value)}
          />
        </div>
      </div>

      <div className="row amb-1 apt-1">
        <div className="col-12">
          <div className="form-check form-switch">
            <input
              type="checkbox" className="form-check-input" id="display_mail"
              checked={(settings.display_mail ?? 0) === 1}
              onChange={(e) => set("display_mail", e.target.checked ? 1 : 0)}
            />
            <label className="form-check-label" htmlFor="display_mail">
              Show E-Mail on profile
            </label>
          </div>
        </div>
      </div>

      <div className="header col-lg-12 p-0 amt-2 amb-1">
        <h2 className="ap-1 bg-header">UPLOAD SiGNATURE</h2>
      </div>
      <div className="row amb-1">
        <div className="col-12">
          <input
            type="text" className="form-control w-100" maxLength={44}
            value={settings.upload_signature ?? ""}
            onChange={(e) => set("upload_signature", e.target.value)}
          />
        </div>
      </div>
    </>
  );

  const sitePanel = (
    <>
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">SiTE</h2>
      </div>

      <div className="row amb-1 apt-1"><div className="col-12">File list mode</div></div>
      <div className="row amb-1">
        <div className="col-xs-12 col-md-6">
          <select
            className="form-select w-100" value={settings.viewmode ?? 0}
            onChange={(e) => set("viewmode", parseInt(e.target.value))}
          >
            <option value={0}>Standard</option>
            <option value={1}>BBS</option>
          </select>
        </div>
      </div>

      <div className="row amb-1"><div className="col-12 apt-1">Default Colly Background</div></div>
      <div className="row amb-1">
        <div className="col-xs-12 col-md-6">
          <select
            className="form-select w-100" value={settings.def_bg_col ?? ""}
            onChange={(e) => set("def_bg_col", e.target.value)}
          >
            {COLOR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row amb-1"><div className="col-12 apt-1">Default Colly Foreground</div></div>
      <div className="row amb-1">
        <div className="col-xs-12 col-md-6">
          <select
            className="form-select w-100" value={settings.def_fg_col ?? ""}
            onChange={(e) => set("def_fg_col", e.target.value)}
          >
            {COLOR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row amb-1"><div className="col-12 apt-1">Default Colly Font</div></div>
      <div className="row amb-1">
        <div className="col-xs-12 col-md-6">
          <select
            className="form-select w-100" value={settings.def_font ?? ""}
            onChange={(e) => set("def_font", e.target.value ? parseInt(e.target.value) : null)}
          >
            {FONT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row amb-1 apt-1">
        <div className="col-12">
          <div className="form-check form-switch">
            <input
              type="checkbox" className="form-check-input" id="crt_effect"
              checked={(settings.crt_effect ?? 0) === 1}
              onChange={(e) => {
                const v = e.target.checked ? 1 : 0;
                set("crt_effect", v);
                autoSaveDisplay({ crt_effect: v });
              }}
            />
            <label className="form-check-label" htmlFor="crt_effect">
              CRT screen effect
            </label>
          </div>
        </div>
      </div>

      <div className="row amb-1">
        <div className="col-12">
          <div className="form-check form-switch">
            <input
              type="checkbox" className="form-check-input" id="anim_effect"
              checked={(settings.anim_effect ?? 0) === 1}
              onChange={(e) => {
                const v = e.target.checked ? 1 : 0;
                set("anim_effect", v);
                autoSaveDisplay({ anim_effect: v });
              }}
            />
            <label className="form-check-label" htmlFor="anim_effect">
              Modem animation effect
            </label>
          </div>
        </div>
      </div>
    </>
  );

  const passwordPanel = (
    <form autoComplete="off" action={pwAction}>
      <div className="container-fluid bg-secondary apb-1 ap-1">
        <div className="header col-lg-12 p-0 amb-1">
          <h2 className="ap-1 bg-header">PASSWORD</h2>
        </div>

        <div className="row amb-1 apt-1"><div className="col-12">Old password</div></div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-8">
            <input type="password" className="form-control w-100" autoComplete="new-password" name="oldpass" />
          </div>
        </div>

        <div className="row amb-1 apt-1"><div className="col-12">New password</div></div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-8">
            <input type="password" className="form-control w-100" autoComplete="new-password" name="newpass" />
          </div>
        </div>

        <div className="row amb-1 apt-1"><div className="col-12">New password again</div></div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-8">
            <input type="password" className="form-control w-100" autoComplete="new-password" name="repeatpass" />
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-12 apt-1">
            <input
              type="submit" className="btn-big bg-green white"
              value="Change Password" disabled={pwPending}
            />
          </div>
        </div>
      </div>
    </form>
  );

  const artistPanel = (
    <div className="container-fluid bg-secondary apb-1 ap-1">
      <div className="header col-lg-12 p-0 amb-1">
        <h2 className="ap-1 bg-header">ARTiST IDENTITY</h2>
      </div>
      <div className="row">
        <div className="col-12">
          Link your scene artist handle(s) to your site account. This connects
          your releases and crew memberships to your profile.
        </div>
      </div>

      {artistMsg && (
        <div className="row apt-1">
          <div className={`col-12 ${artistMsg.success ? "green" : "red"}`}>
            {artistMsg.text}
          </div>
        </div>
      )}

      {suggestedArtists.length > 0 && (
        <>
          <div className="row apt-1">
            <div className="col-12">
              <span className="yellow">Suggested match{suggestedArtists.length > 1 ? "es" : ""} found:</span>
            </div>
          </div>
          {suggestedArtists.map(a => (
            <div key={a.id} className="row apt-1 align-items-center">
              <div className="col-xs-12 col-md-6">
                <a className="magenta" href={`/artist/${a.artisturl}`}>{a.nick}</a>
                <span className="lightgrey"> (artist page)</span>
              </div>
              <div className="col-xs-12 col-md-6">
                <input
                  type="button" className="btn-big" value="Claim this handle"
                  onClick={() => claimArtist(a.nick)}
                />
              </div>
            </div>
          ))}
        </>
      )}

      {linkedArtists.length > 0 && (
        <>
          <div className="row apt-1">
            <div className="col-12"><span className="white">Linked handles:</span></div>
          </div>
          {linkedArtists.map(a => (
            <div key={a.id} className="row apt-1 align-items-center">
              <div className="col-xs-12 col-md-6">
                <a className="magenta" href={`/artist/${a.artisturl}`}>{a.nick}</a>
              </div>
              <div className="col-xs-12 col-md-6">
                <input
                  type="button" className="btn-big" value="Unlink"
                  onClick={() => unclaimArtist(a.id, a.nick)}
                />
              </div>
            </div>
          ))}
        </>
      )}

      <div className="row apt-1"><div className="col-12">Claim by artist nick:</div></div>
      <div className="row apt-1">
        <div className="col-xs-12 col-md-8 apb-1">
          <input
            type="text" className="form-control w-100" placeholder="Enter artist nick..."
            value={claimNick} onChange={e => setClaimNick(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && claimNick.trim()) claimArtist(claimNick.trim()); }}
          />
        </div>
        <div className="col-xs-12 col-md-4 apb-1">
          <input
            type="button" className="btn-big" value="Claim"
            onClick={() => { if (claimNick.trim()) claimArtist(claimNick.trim()); }}
          />
        </div>
      </div>
    </div>
  );

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
              className={isActive ? "yellow" : "lightgrey"}
              style={{
                background: isActive ? "#aa00aa" : "transparent",
                color: isActive ? "#ffffff" : undefined,
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

      {alertMsg && (
        <div className={`bs-component quick-alert animate__animated ${
          alertMsg.success ? "animate__bounceIn alert alert-success" : "animate__shakeX alert alert-warning"
        }`}>
          {alertMsg.text}
        </div>
      )}

      {(activeTab === "profile" || activeTab === "site") && (
        <form autoComplete="off" action={saveAction}>
          {hiddenFields}
          <div className="container-fluid bg-secondary apb-1 ap-1">
            {activeTab === "profile" && profilePanel}
            {activeTab === "site" && sitePanel}
            <div className="row amb-1">
              <div className="col-12 apt-1">
                <input
                  type="submit" className="btn-big bg-green white"
                  value="Save" disabled={savePending}
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {activeTab === "password" && passwordPanel}
      {activeTab === "artist" && artistPanel}
      {activeTab === "feed" && <LiveFeedSettings />}
      {activeTab === "widgets" && <WidgetSettings />}
    </>
  );
}
