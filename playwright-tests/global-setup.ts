import { request } from '@playwright/test';

/**
 * The backend is hosted on a free Render service in staging, which spins
 * down after inactivity and can take up to ~1 minute to respond again. Poll
 * its health check endpoint (which also verifies DB connectivity) until it
 * reports healthy before any test runs, instead of letting individual
 * assertions time out. The frontend (Vercel) isn't checked here - it doesn't
 * have the same cold-start behavior.
 */
const WAKE_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 3_000;

export default async function globalSetup() {
  const apiURL = process.env.API_URL || 'http://localhost:5258';
  const healthCheckURL = `${apiURL}/health-check`;
  const context = await request.newContext();

  try {
    const deadline = Date.now() + WAKE_TIMEOUT_MS;

    while (Date.now() < deadline) {
      try {
        const res = await context.get(healthCheckURL, { timeout: POLL_INTERVAL_MS });
        if (res.ok()) return;
      } catch {
        // Still cold-starting or unreachable - fall through and retry.
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(`${healthCheckURL} did not report healthy within ${WAKE_TIMEOUT_MS}ms.`);
  } finally {
    await context.dispose();
  }
}
