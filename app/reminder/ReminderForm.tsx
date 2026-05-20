"use client";

import React, { useState } from "react";

type Step = "request" | "sent" | "reset-form" | "changed";

interface Props {
  resetToken?: string;
}

export default function ReminderForm({ resetToken }: Props) {
  const [step, setStep] = useState<Step>(resetToken ? "reset-form" : "request");
  const [email, setEmail] = useState("");
  const [spam, setSpam] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string>("");

  async function handleRequest() {
    setError("");
    if (!email) {
      setError("E-Mail address is required.");
      return;
    }
    if (spam !== "iamnotarobot") {
      setError('Please enter "iamnotarobot" in the spam check field.');
      return;
    }
    const res = await fetch("/api/reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, spam }),
    });
    if (res.ok) {
      setStep("sent");
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Request failed. Please try again.");
    }
  }

  async function handleReset() {
    setError("");
    if (!password || !repeatPassword) {
      setError("Both password fields are required.");
      return;
    }
    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }
    const res = await fetch("/api/reminder/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, password, repeatPassword }),
    });
    if (res.ok) {
      setStep("changed");
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Reset failed. The link may have expired.");
    }
  }

  if (step === "sent") {
    return (
      <div className="col-lg-12">
        <div className="container-fluid bg-secondary amb-1 apb-1">
          <div className="row apl-1 apr-1 apt-1">
            <div className="col-12 white">
              Password reset instructions have been sent to your e-mail address.
              Please check your inbox and follow the link within 4 hours.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "changed") {
    return (
      <div className="col-lg-12">
        <div className="container-fluid bg-secondary amb-1 apb-1">
          <div className="row apl-1 apr-1 apt-1">
            <div className="col-12 white">
              Your password has been updated. You can now{" "}
              <a href="/login">log in</a> with your new password.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "reset-form") {
    return (
      <div className="col-lg-12">
        <div className="container-fluid bg-secondary amb-1 apb-1">
          {error && (
            <div className="row apl-1 apr-1 apt-1">
              <div className="col-12" style={{ color: "#ff5555" }}>{error}</div>
            </div>
          )}
          <div className="row apb-1 apl-1 apr-1 apt-1">
            <div className="col-6"><span className="white">New Password</span></div>
            <div className="col-6"><span className="white">Repeat Password</span></div>
          </div>
          <div className="row apb-1 apl-1 apr-1">
            <div className="col-6">
              <input
                type="password"
                className="form-control w-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
              />
            </div>
            <div className="col-6">
              <input
                type="password"
                className="form-control w-100"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="row apl-1 apr-1 apb-1">
            <div className="col-12">
              <input type="button" className="btn-big" value="Save!" onClick={handleReset} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // step === "request"
  return (
    <div className="col-lg-12">
      <div className="container-fluid bg-secondary amb-1 apb-1">
        {error && (
          <div className="row apl-1 apr-1 apt-1">
            <div className="col-12" style={{ color: "#ff5555" }}>{error}</div>
          </div>
        )}
        <div className="row apl-1 apr-1 apt-1">
          <div className="col-6 white">E-Mail</div>
        </div>
        <div className="row apl-1 apr-1 apb-1">
          <div className="col-6">
            <input
              type="email"
              name="mail"
              className="form-control w-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>
        </div>
        <div className="row apl-1 apr-1">
          <div className="col-6">Enter iamnotarobot here:</div>
        </div>
        <div className="row apl-1 apr-1 apb-1">
          <div className="col-6">
            <input
              type="text"
              className="form-control w-100"
              value={spam}
              onChange={(e) => setSpam(e.target.value)}
              placeholder="iamnotarobot"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="row apl-1 apr-1 apb-1">
          <div className="col-12">
            <input type="button" className="btn-big" value="Reset!" onClick={handleRequest} />
          </div>
        </div>
      </div>
    </div>
  );
}
