import { ensureInitialized, startBackgroundJobs } from "./orchestrator";

declare global {
  var __backgroundJobsStarted: boolean | undefined;
}

export function ensureBackgroundJobs() {
  if (global.__backgroundJobsStarted) return;
  ensureInitialized().then(() => {
    startBackgroundJobs();
    global.__backgroundJobsStarted = true;
  });
}
