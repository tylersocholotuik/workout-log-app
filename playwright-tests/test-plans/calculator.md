# One-Rep Max Calculator

**Spec file:** [`tests/unauthenticated/calculator.spec.ts`](../tests/unauthenticated/calculator.spec.ts)
**Project:** `unauthenticated`
**Preconditions:** None - the whole page is client-side only (no API calls, no auth)

## Purpose

Covers the `/calculator` page: entering a set to estimate a one-rep max,
converting the result between lbs/kg, and the RPE reference table. Belongs
in the `unauthenticated` project since nothing here touches the backend or
requires a signed-in user.

> Note: reps on this page are constrained to **1-10** (not 0-9999 like the
> workout page's set rows) - that's intentional here, since the underlying
> e1RM formula's data only covers that range (see `utils/calculator/rpeData.ts`).

## Scenarios

### Page load

- **calculator page loads with an empty state** — go to `/calculator` →
  Weight/Reps/RPE inputs are empty, "Enter values above to calculate" is
  shown, and the RPE data table is visible with every cell showing "-".

### Input validation

- **weight accepts a valid value** — enter `225.5` → the input keeps the
  value.
- **weight rejects an invalid character** — type a letter into the Weight
  input → the character is not accepted (representative check only -
  exhaustive regex boundaries belong in a component test).
- **reps is limited to 1-10** — entering `11` is rejected; entering `10` is
  accepted.
- **RPE is limited to 6-10** — entering a value below 6 (e.g. `5`) is
  rejected; entering `10` is accepted.

### Calculating the estimate

- **entering weight, reps, and RPE calculates the estimate** — fill all
  three with valid values → the "Enter values above to calculate" message is
  replaced with a computed one-rep max value and unit, and a unit-conversion
  toggle button appears.
- **clearing any one field clears the estimate** — after a valid
  calculation, clear just the RPE (or weight, or reps) field → the result
  reverts to "Enter values above to calculate".

### Weight unit (input)

- **toggling the input's weight unit changes the highlighted unit** — click
  the lbs/kg toggle beside the Weight input → the newly selected unit is
  shown bold/highlighted, and is used as the unit for a new calculation.

### Weight unit conversion (result)

- **toggling the result's unit converts the displayed value** — after
  calculating an estimate, click the result's weight-unit toggle button →
  the displayed number changes to the converted value (rounded) in the other
  unit; the form inputs themselves are unchanged.
- **changing the input's weight unit resets the result's conversion** —
  after manually toggling the result's conversion unit, change the input's
  weight unit (in the form) → the displayed result unit snaps back to match
  the input's new unit, discarding the earlier manual conversion.

### RPE data table

- **table reflects the calculated estimate** — after calculating a one-rep
  max, the table's cells show computed (non-"-") weights for eligible
  rep/RPE combinations, with column headers reflecting the current
  (converted) weight unit.
- **"Clear" resets the form and the table** — click "Clear" → Weight/Reps/RPE
  inputs are emptied, the weight unit resets to lbs, the result reverts to
  "Enter values above to calculate", and the table cells reset to "-".
