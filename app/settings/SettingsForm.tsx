"use client";

import React, { useEffect, useState, useCallback, FormEvent } from "react";

interface ArtistHandle {
  id: number;
  nick: string;
  artisturl: string;
}

interface Settings {
  nick: string | null;
  crew: string | null;
  byear: number | null;
  bmonth: number | null;
  bday: number | null;
  country: string | null;
  mail: string | null;
  webpage: string | null;
  upload_signature: string | null;
  viewmode: number | null;
  def_bg_col: string | null;
  def_fg_col: string | null;
  display_mail: number | null;
  def_font: number | null;
  crt_effect: number | null;
  anim_effect: number | null;
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

const CURRENT_YEAR = new Date().getFullYear();

export default function SettingsForm() {
  const [settings, setSettings] = useState<Settings>({
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
  });

  const [oldpass, setOldpass] = useState("");
  const [newpass, setNewpass] = useState("");
  const [repeatpass, setRepeatpass] = useState("");
  const [alertMsg, setAlertMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [saveDisabled, setSaveDisabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const [linkedArtists, setLinkedArtists] = useState<ArtistHandle[]>([]);
  const [suggestedArtists, setSuggestedArtists] = useState<ArtistHandle[]>([]);
  const [claimNick, setClaimNick] = useState("");
  const [artistMsg, setArtistMsg] = useState<{ text: string; success: boolean } | null>(null);

  const loadArtists = useCallback(() => {
    fetch("/api/settings/artist")
      .then((r) => r.json())
      .then((d: { linked: ArtistHandle[]; suggested: ArtistHandle[] }) => {
        setLinkedArtists(d.linked ?? []);
        setSuggestedArtists(d.suggested ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Settings) => {
        setSettings(data);
        setSaveDisabled(false);
        setLoading(false);
      })
      .catch(() => {
        showAlert("An error occurred loading your settings.", false);
        setSaveDisabled(true);
        setLoading(false);
      });
    loadArtists();
  }, [loadArtists]);

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (oldpass && !newpass) {
      showAlert("You have not specified a new password.", false);
      return;
    }
    if ((newpass || repeatpass) && newpass !== repeatpass) {
      showAlert("New passwords do not match.", false);
      return;
    }
    if (!oldpass && newpass) {
      showAlert("You must enter your old password to change it.", false);
      return;
    }
    if (newpass) {
      if (
        !/[A-Z]/.test(newpass) ||
        !/[a-z]/.test(newpass) ||
        !/[0-9]/.test(newpass) ||
        !/[^A-Za-z0-9]/.test(newpass)
      ) {
        showAlert(
          "Password must include uppercase, lowercase, a number, and a special character.",
          false
        );
        return;
      }
    }

    const body: Record<string, unknown> = { ...settings };
    if (newpass) {
      body.oldpass = oldpass;
      body.newpass = newpass;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { status?: boolean; error?: string };
      if (res.ok && data.status) {
        showAlert("Settings saved successfully!", true);
        setOldpass("");
        setNewpass("");
        setRepeatpass("");
      } else {
        showAlert(data.error ?? "An error occurred saving the settings.", false);
      }
    } catch {
      showAlert("An unexpected error occurred.", false);
    }
  }

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="container-fluid bg-secondary amb-1 apb-1 ap-1">
        Loading settings...
      </div>
    );
  }

  return (
    <form autoComplete="off" onSubmit={handleSubmit}>
      <div className="container-fluid bg-secondary amb-1 apb-1 ap-1">
        {alertMsg && (
          <div
            className={`bs-component quick-alert animate__animated ${
              alertMsg.success ? "animate__bounceIn alert alert-success" : "animate__shakeX alert alert-warning"
            }`}
          >
            {alertMsg.text}
          </div>
        )}

        {/* User Settings */}
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <span className="white">User Settings</span>
          </div>
        </div>

        <div className="row apt-1">
          <div className="col-xs-12 col-md-6">Nick</div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6 apb-1 apt-1">
            <input
              type="text"
              className="w-100"
              maxLength={14}
              value={settings.nick ?? ""}
              onChange={(e) => set("nick", e.target.value)}
            />
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">Crew</div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <input
              type="text"
              className="w-100"
              value={settings.crew ?? ""}
              onChange={(e) => set("crew", e.target.value)}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-xs-12 col-md-6 apt-1">Birth</div>
        </div>
        <div className="row">
          <div className="col-xs-12 col-md-2 apt-1">
            <select
              className="select2"
              value={settings.byear ?? ""}
              onChange={(e) => set("byear", e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Year</option>
              {Array.from({ length: CURRENT_YEAR - 5 - 1920 + 1 }, (_, i) => 1920 + i).map(
                (y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="col-xs-12 col-md-2 apt-1">
            <select
              className="select2"
              value={settings.bmonth ?? ""}
              onChange={(e) => set("bmonth", e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="col-xs-12 col-md-2 apt-1">
            <select
              className="select2"
              value={settings.bday ?? ""}
              onChange={(e) => set("bday", e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-xs-12 col-md-6 apt-1">Country</div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <input
              type="text"
              className="w-100"
              value={settings.country ?? ""}
              onChange={(e) => set("country", e.target.value)}
            />
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-xs-12 col-md-6 apt-1">Mail</div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <input
              type="email"
              className="w-100"
              value={settings.mail ?? ""}
              onChange={(e) => set("mail", e.target.value)}
            />
          </div>
        </div>

        <div className="row amb-1 apt-1">
          <div className="col-xs-12 col-md-6 apt-1">Webpage</div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <input
              type="url"
              className="w-100"
              value={settings.webpage ?? ""}
              onChange={(e) => set("webpage", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="row amb-1 apt-1">
          <div className="col-xs-12 col-md-6">
            <div className="custom-control custom-switch">
              Show E-Mail
              <input
                type="checkbox"
                className="custom-control-input"
                id="display_mail"
                checked={(settings.display_mail ?? 0) === 1}
                onChange={(e) => set("display_mail", e.target.checked ? 1 : 0)}
              />
              <label className="custom-control-label" htmlFor="display_mail" />
            </div>
          </div>
        </div>

        {/* Password Settings */}
        <div className="row amb-1 apt-1">
          <div className="col-xs-12 col-md-12 apt-1">
            <span className="white">Password Settings</span>
          </div>
        </div>

        <div className="row amb-1 apt-1">
          <div className="col-xs-12 col-md-6">Old password</div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <input
              type="password"
              className="w-100"
              autoComplete="new-password"
              value={oldpass}
              onChange={(e) => setOldpass(e.target.value)}
            />
          </div>
        </div>

        <div className="row amb-1 apt-1">
          <div className="col-xs-12 col-md-6">New password</div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <input
              type="password"
              className="w-100"
              autoComplete="new-password"
              value={newpass}
              onChange={(e) => setNewpass(e.target.value)}
            />
          </div>
        </div>

        <div className="row amb-1 apt-1">
          <div className="col-xs-12 col-md-6">New password again</div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <input
              type="password"
              className="w-100"
              autoComplete="new-password"
              value={repeatpass}
              onChange={(e) => setRepeatpass(e.target.value)}
            />
          </div>
        </div>

        {/* Site Settings */}
        <div className="row amb-1 apt-1">
          <div className="col-xs-12 col-md-6 apt-1">
            <span className="white">Site Settings</span>
          </div>
        </div>

        <div className="row amb-1 apt-1">
          <div className="col-xs-12 col-md-6">File list mode</div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6 apb-1">
            <select
              className="select2 w-100"
              value={settings.viewmode ?? 0}
              onChange={(e) => set("viewmode", parseInt(e.target.value))}
            >
              <option value={0}>Standard</option>
              <option value={1}>BBS</option>
            </select>
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-xs-12 col-md-6 d-flex">
            <div className="apr-1">Default Colly Background</div>
            <div>
              <select
                className="custom-select"
                value={settings.def_bg_col ?? ""}
                onChange={(e) => set("def_bg_col", e.target.value)}
              >
                {COLOR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-xs-12 col-md-5 d-flex">
            <div className="apr-1">Default Colly Foreground</div>
            <div>
              <select
                className="custom-select"
                value={settings.def_fg_col ?? ""}
                onChange={(e) => set("def_fg_col", e.target.value)}
              >
                {COLOR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-xs-12 col-md-6 apt-1">Default Colly Font</div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6 apb-1">
            <select
              className="select2 w-100"
              value={settings.def_font ?? ""}
              onChange={(e) => set("def_font", e.target.value ? parseInt(e.target.value) : null)}
            >
              {FONT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <div className="form-group">
              <div className="custom-control custom-switch">
                CRT screen effect
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="crt_effect"
                  checked={(settings.crt_effect ?? 0) === 1}
                  onChange={(e) => set("crt_effect", e.target.checked ? 1 : 0)}
                />
                <label className="custom-control-label" htmlFor="crt_effect" />
              </div>
            </div>
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <div className="form-group">
              <div className="custom-control custom-switch">
                Modem animation effect
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="anim_effect"
                  checked={(settings.anim_effect ?? 0) === 1}
                  onChange={(e) => set("anim_effect", e.target.checked ? 1 : 0)}
                />
                <label className="custom-control-label" htmlFor="anim_effect" />
              </div>
            </div>
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-xs-12 col-md-6">
            <span className="white">Upload Signature</span>
          </div>
        </div>
        <div className="row amb-1">
          <div className="col-xs-12 col-md-6 apb-1">
            <input
              type="text"
              className="w-100"
              maxLength={44}
              value={settings.upload_signature ?? ""}
              onChange={(e) => set("upload_signature", e.target.value)}
            />
          </div>
        </div>

        <div className="row amb-1">
          <div className="col-12 apt-1">
            <input
              type="submit"
              className="btn-big bg-green white"
              value="Save"
              disabled={saveDisabled}
            />
          </div>
        </div>
      </div>

      {/* Artist Identity — separate from main form, no submit */}
      <div className="container-fluid bg-secondary amb-1 apb-1 ap-1">
        <div className="row amb-1">
          <div className="col-xs-12 col-md-12 apt-1">
            <span className="white">Artist Identity</span>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12 col-md-10">
            Link your scene artist handle(s) to your site account. This connects
            your releases and crew memberships to your profile.
          </div>
        </div>

        {artistMsg && (
          <div className={`row apt-1`}>
            <div className={`col-12 ${artistMsg.success ? "green" : "red"}`}>
              {artistMsg.text}
            </div>
          </div>
        )}

        {/* Suggested matches */}
        {suggestedArtists.length > 0 && (
          <>
            <div className="row apt-1">
              <div className="col-12">
                <span className="yellow">Suggested match{suggestedArtists.length > 1 ? "es" : ""} found:</span>
              </div>
            </div>
            {suggestedArtists.map(a => (
              <div key={a.id} className="row apt-1 align-items-center">
                <div className="col-xs-12 col-md-4">
                  <a className="magenta" href={`/artist/${a.artisturl}`}>{a.nick}</a>
                  <span className="lightgrey"> (artist page)</span>
                </div>
                <div className="col-xs-12 col-md-4">
                  <input
                    type="button"
                    className="btn-big"
                    value="Claim this handle"
                    onClick={() => claimArtist(a.nick)}
                  />
                </div>
              </div>
            ))}
          </>
        )}

        {/* Linked handles */}
        {linkedArtists.length > 0 && (
          <>
            <div className="row apt-1">
              <div className="col-12">
                <span className="white">Linked handles:</span>
              </div>
            </div>
            {linkedArtists.map(a => (
              <div key={a.id} className="row apt-1 align-items-center">
                <div className="col-xs-12 col-md-4">
                  <a className="magenta" href={`/artist/${a.artisturl}`}>{a.nick}</a>
                </div>
                <div className="col-xs-12 col-md-4">
                  <input
                    type="button"
                    className="btn-big"
                    value="Unlink"
                    onClick={() => unclaimArtist(a.id, a.nick)}
                  />
                </div>
              </div>
            ))}
          </>
        )}

        {/* Manual claim */}
        <div className="row apt-1">
          <div className="col-12">Claim by artist nick:</div>
        </div>
        <div className="row apt-1">
          <div className="col-xs-12 col-md-4 apb-1">
            <input
              type="text"
              className="w-100"
              placeholder="Enter artist nick..."
              value={claimNick}
              onChange={e => setClaimNick(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && claimNick.trim()) claimArtist(claimNick.trim()); }}
            />
          </div>
          <div className="col-xs-12 col-md-4 apb-1">
            <input
              type="button"
              className="btn-big"
              value="Claim"
              onClick={() => { if (claimNick.trim()) claimArtist(claimNick.trim()); }}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
