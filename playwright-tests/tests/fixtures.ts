import { test as base } from '@playwright/test';

import {
  deleteWorkoutViaApi,
  getUserProfileViaApi,
  getUserSettingsViaApi,
  updateUserNamesViaApi,
  updateUserSettingsViaApi,
} from './helpers';

type Fixtures = {
  /** Registers a workout id to be deleted after the test. Unlike calling
   * deleteWorkoutViaApi() as the last line of a test body, this teardown
   * always runs - even if an earlier assertion throws - so a failing test
   * can no longer leak its workout. */
  trackWorkout: (id: string | undefined) => void;
  /** Snapshots the shared test account's profile names and preferences
   * before the test and always restores them afterward (via direct API
   * calls, not the UI), even if the test fails. Request this fixture in any
   * test that changes either - the account is shared with every other spec
   * file. The email and password are never touched by tests (see
   * test-plans/account.md), so they are neither snapshotted nor restored. */
  restoreAccount: void;
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

  restoreAccount: async ({ request }, use) => {
    const originalSettings = await getUserSettingsViaApi(request);
    const originalProfile = await getUserProfileViaApi(request);

    await use();

    // Attempt both restores even if the first one fails, then surface every
    // failure - a silently-unrestored shared account is worse than a noisy
    // teardown.
    const errors: unknown[] = [];
    try {
      await updateUserSettingsViaApi(request, originalSettings);
    } catch (e) {
      errors.push(e);
    }
    try {
      const current = await getUserProfileViaApi(request);
      // The API can't set displayName back to null, only to '' - treat the
      // two as equal so an untouched account isn't needlessly patched.
      if (
        current.firstName !== originalProfile.firstName ||
        current.lastName !== originalProfile.lastName ||
        (current.displayName ?? '') !== (originalProfile.displayName ?? '')
      ) {
        await updateUserNamesViaApi(request, {
          firstName: originalProfile.firstName,
          lastName: originalProfile.lastName,
          displayName: originalProfile.displayName ?? '',
        });
      }
    } catch (e) {
      errors.push(e);
    }
    if (errors.length > 0) {
      throw errors[0];
    }
  },
});

export { expect } from '@playwright/test';
