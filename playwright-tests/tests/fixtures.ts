import { test as base } from '@playwright/test';

import { deleteWorkoutViaApi } from './helpers';

type Fixtures = {
  /** Registers a workout id to be deleted after the test. Unlike calling
   * deleteWorkoutViaApi() as the last line of a test body, this teardown
   * always runs - even if an earlier assertion throws - so a failing test
   * can no longer leak its workout. */
  trackWorkout: (id: string | undefined) => void;
};

export const test = base.extend<Fixtures>({
  // Depends on the built-in `request` fixture so deletes are authenticated
  // with the same per-project storageState the test itself used - a
  // freshly created APIRequestContext would have no auth cookie.
  trackWorkout: async ({ request }, use) => {
    const ids: (string | undefined)[] = [];

    await use((id) => {
      ids.push(id);
    });

    for (const id of ids) {
      await deleteWorkoutViaApi(request, id);
    }
  },
});

export { expect } from '@playwright/test';
