"use client";

declare global {
  interface Window {
    /** Installed by Google's recaptcha/api.js once it has loaded. */
    grecaptcha?: { getResponse: () => string; reset: () => void };
  }
}

import React, { useState, FormEvent } from "react";
import Script from "next/script";
import {
  ACTIVITY_TYPES,
  ACTIVITY_LABELS,
  type ActivityType,
} from "@/lib/activity-types";

export default function RegisterForm() {
  const [nick, setNick] = useState("");
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [activityOptIn, setActivityOptIn] = useState<Set<ActivityType>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleOptIn = (type: ActivityType) => {
    setActivityOptIn((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nick,
          mail,
          password,
          password2,
          activityOptIn: Array.from(activityOptIn),
          // Google's widget writes the solved token here. The server refuses
          // the registration without it -- see lib/recaptcha.ts.
          recaptchaToken: window.grecaptcha?.getResponse() ?? "",
        }),
      });
      const data = (await res.json()) as { status?: boolean; error?: string };
      if (res.ok && data.status) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Registration failed.");
        // A token is single-use: without this the next attempt replays it and
        // Google answers timeout-or-duplicate.
        window.grecaptcha?.reset();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="container-fluid bg-secondary amb-1 apb-1">
        <div className="row">
          <div className="col-12 text-center apt-1">
            <div className="bs-component aml-1 amb-1">
              <div className="alert alert-success">
                Your account has been created. A mail with instructions has been sent to your
                e-mail address.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="container-fluid bg-secondary amb-1 apb-1">
        {error && (
          <div className="row">
            <div className="col-lg-12">
              <div className="bs-component aml-1 amb-1">
                <div className="alert alert-danger">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-6">
            <span className="white">Nick</span>
          </div>
          <div className="col-6">
            <span className="white">Password</span>
          </div>
        </div>

        <div className="row apb-1">
          <div className="col-6">
            <input
              type="text"
              name="nick"
              className="w-100"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              required
              minLength={2}
              maxLength={60}
              pattern="[A-Za-z0-9\-\.#_!\^]{2,60}"
              title="2-60 characters: letters, digits, - . # _ ! ^"
            />
          </div>
          <div className="col-6">
            <input
              type="password"
              name="password"
              className="w-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-6">E-Mail</div>
          <div className="col-6">Repeat Password</div>
        </div>

        <div className="row apb-1">
          <div className="col-6">
            <input
              type="email"
              name="mail"
              className="w-100"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              required
            />
          </div>
          <div className="col-6">
            <input
              type="password"
              name="password2"
              className="w-100"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="row apb-1">
          <div className="col-12">
            <small className="form-text">
              Password must include uppercase, lowercase, a number, and a special character.
            </small>
          </div>
        </div>

        <div className="row apb-1">
          <div className="col-12">
            <h3 className="white amt-1 amb-0" style={{ fontSize: "14px" }}>
              Live Feed Privacy
            </h3>
            <small className="form-text lightgrey">
              By default, none of your actions appear in the site live feed. Tick the
              ones you would like to broadcast — you can change this any time in your
              settings.
            </small>
            <div className="apt-1">
              {ACTIVITY_TYPES.map((type) => (
                <label
                  key={type}
                  style={{
                    display: "block",
                    padding: "2px 0",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={activityOptIn.has(type)}
                    onChange={() => toggleOptIn(type)}
                    style={{ marginRight: "8px", verticalAlign: "middle" }}
                  />
                  Broadcast <span className="yellow">{ACTIVITY_LABELS[type]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="row apb-1">
          {/* The script was missing, so this div rendered nothing at all and
              no token was ever produced. The site key is public by design; it
              comes from env so a rotation is a config change, not a deploy. */}
          <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" />
          <div
            className="g-recaptcha"
            data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "6Le5rpQrAAAAACR_OlbAuKMTlgHY6wnDqJYuBkVQ"}
          />
        </div>

        <div className="row">
          <div className="col-12">
            <input
              type="submit"
              value={submitting ? "Registering..." : "Join!"}
              name="join"
              className="btn-big"
              disabled={submitting}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
