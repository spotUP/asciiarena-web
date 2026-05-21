import { cache } from "react";
import { auth } from "@/lib/auth";

// Deduplicate auth() calls within a single server render.
// Both SiteLayout and page components call auth() — this ensures one DB round-trip.
export const getSession = cache(auth);
