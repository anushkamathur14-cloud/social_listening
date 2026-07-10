import { ensureInitialized, pollAllSignals } from "../lib/pipeline/orchestrator";

async function main() {
  console.log("[poller] Initializing signal-ads-demo poller...");
  await ensureInitialized();
  console.log("[poller] Starting poll loop...");

  await pollAllSignals();

  const interval = parseInt(process.env.POLL_INTERVAL_MS ?? "90000", 10);
  setInterval(() => {
    pollAllSignals().catch((err) => console.error("[poller] Error:", err));
  }, interval);

  console.log(`[poller] Polling every ${interval}ms`);
}

main().catch(console.error);
