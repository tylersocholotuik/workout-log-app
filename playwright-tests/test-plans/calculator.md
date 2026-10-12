# One-Rep Max Calculator

**Spec file:** [`tests/unauthenticated/calculator.spec.ts`](../tests/unauthenticated/calculator.spec.ts)
**Project:** `unauthenticated`
**Preconditions:** None - the whole page is client-side only (no API calls, no auth)

## Purpose

Covers the `/calculator` page: entering a set to estimate a one-rep max,
switching the effort rating between RPE/RIR, converting the result between
lbs/kg, and the RPE/RIR reference table. Belongs in the `unauthenticated`
project since nothing here touches the backend or requires a signed-in user.

> Note: reps on this page are constrained to **1-10** (not 0-9999 like the
> workout page's set rows) - that's intentional here, since the underlying
> e1RM formula's data only covers that range (see `utils/calculator/rpeData.ts`).

> Note: the effort rating type defaults to RPE. Switching to RIR converts
> any value already entered (e.g. RPE 8 → RIR 2) using `convertEffortRating`
> (`RIR = 10 - ceil(RPE)`, and the same formula converts RIR back to RPE).

## Scenarios

### Page load

- **calculator page loads with an empty state** — go to `/calculator` →
  Weight/Reps/RPE inputs are empty (effort rating type defaults to RPE),
  "Enter values above to calculate" is shown, and the data table is visible
  with its row header reading "RPE" and every cell showing "-".

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
- **RIR is limited to 0-4** — after switching the effort rating type to RIR,
  entering a value above 4 (e.g. `5`) is rejected; entering a decimal (e.g.
  `2.5`) is rejected since RIR must be a whole number; entering `4` is
  accepted.

### Calculating the estimate

- **entering weight, reps, and an effort rating calculates the estimate** —
  fill all three with valid values (RPE or RIR) → the "Enter values above to
  calculate" message is replaced with a computed one-rep max value and
  unit, and a unit-conversion toggle button appears.
- **clearing any one field clears the estimate** — after a valid
  calculation, clear just the effort rating (or weight, or reps) field →
  the result reverts to "Enter values above to calculate".

### Weight unit (input)

- **toggling the input's weight unit changes the highlighted unit** — click
  the lbs/kg toggle inside the Weight input → the newly selected unit is
  shown bold/highlighted, and is used as the unit for a new calculation.

### Effort rating type (RPE/RIR)

- **toggling the effort rating type switches between RPE and RIR** — click
  the RPE/RIR toggle inside the effort rating input → the newly selected
  type is shown bold/highlighted, the input's label switches to "RPE" or
  "RIR", and the tooltip updates to describe the new type and its range
  (RPE: Rate of Perceived Exertion, range 6-10 in steps of 0.5; RIR: Reps in
  Reserve, range 0-4).
- **switching the effort rating type converts an existing value** — enter a
  valid RPE value, then toggle to RIR (or vice versa) → the input's value
  is automatically converted to the equivalent value for the new type, and
  the one-rep max recalculates using the converted value.

### Weight unit conversion (result)

- **toggling the result's unit converts the displayed value** — after
  calculating an estimate, click the result's weight-unit toggle button →
  the displayed number changes to the converted value (rounded) in the other
  unit; the form inputs themselves are unchanged.
- **changing the input's weight unit resets the result's conversion** —
  after manually toggling the result's conversion unit, change the input's
  weight unit (in the form) → the displayed result unit snaps back to match
  the input's new unit, discarding the earlier manual conversion.

### RPE / RIR data table

- **table reflects the calculated estimate** — after calculating a one-rep
  max, the table's cells show computed (non-"-") weights for eligible
  rep/RPE combinations, with column headers reflecting the current
  (converted) weight unit, and the row header reading "RPE".
- **switching to RIR relabels the table's rows** — toggle the effort rating
  type to RIR → the row header changes to "RIR", whole-number RPE rows
  (6, 7, 8, 9, 10) show their converted RIR value as the row label, and the
  half-step RPE rows (6.5, 7.5, 8.5, 9.5) show a blank label with every cell
  in that row showing "-" (there's no whole-number RIR equivalent for a
  half-step RPE value).
- **"Clear" resets the form and the table** — click "Clear" → Weight/Reps
  and the effort rating inputs are emptied, the weight unit resets to lbs,
  the effort rating type resets to RPE, the result reverts to "Enter values
  above to calculate", and the table cells reset to "-".
