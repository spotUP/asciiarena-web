"use client";

import { useEffect } from "react";
import { buildLegacyAdminHashRedirect } from "./legacyHash";

export default function LegacyHashRedirect() {
  useEffect(() => {
    const redirectTo = buildLegacyAdminHashRedirect(window.location.hash);
    if (redirectTo) window.location.replace(redirectTo);
  }, []);

  return null;
}
