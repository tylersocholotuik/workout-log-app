import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:5258';
const EMAIL = process.env.TEST_USER_EMAIL;
const PASSWORD = process.env.TEST_USER_PASSWORD;
// Safety net for workouts test runs failed (or got interrupted) before
// their own cleanup could run. Only ever touches workouts titled with this
// prefix (see uniqueTitle() in tests/helpers.ts) - never anything else.
const TEST_DATA_PREFIX = 'E2E ';

interface Workout {
  id: string;
  title: string;
}

async function login(): Promise<string> {
  if (!EMAIL || !PASSWORD) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set. See .env.example.');
  }

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }

  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('Login succeeded but no auth cookie was returned.');
  }

  return setCookie.split(';')[0];
}

async function main() {
  const cookie = await login();
  const headers = { Cookie: cookie, 'X-Requested-With': 'XMLHttpRequest' };

  const workoutsRes = await fetch(`${API_URL}/api/workouts`, { headers });
  if (!workoutsRes.ok) {
    throw new Error(`Failed to list workouts: ${workoutsRes.status} ${await workoutsRes.text()}`);
  }

  const workouts: Workout[] = await workoutsRes.json();
  const testWorkouts = workouts.filter((w) => w.title.startsWith(TEST_DATA_PREFIX));

  console.log(`${testWorkouts.length} of ${workouts.length} workout(s) look like leftover test data.`);

  let failures = 0;
  for (const workout of testWorkouts) {
    const res = await fetch(`${API_URL}/api/workouts/${workout.id}`, {
      method: 'DELETE',
      headers,
    });
    if (res.ok) {
      console.log(`  deleted: ${workout.title} (${workout.id})`);
    } else {
      failures++;
      console.log(`  FAILED (${res.status}): ${workout.title} (${workout.id})`);
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
