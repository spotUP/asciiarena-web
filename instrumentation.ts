// Next.js instrumentation hook — runs once when the server boots.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Warm the scenewall widget cache so the first visitors after a deploy
    // don't pay the ~10s upstream latency (or hit a failed cold fetch).
    const { warmScenewallCache } = await import("./lib/scenewall");
    warmScenewallCache();
  }
}
