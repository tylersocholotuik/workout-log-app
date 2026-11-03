// Shared input-validation rules (regex + min/max) for numeric inputs used
// across the workout log (set values and targets).

// Weight: min 0, max 9999, steps of 0.5, can be empty string,
// only 1 digit after decimal (0 or 5), only 1 decimal
export const WEIGHT_REGEX = /^(\d{0,4})(\.([05]?)?)?$/;
export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 9999;

// Reps: min 0, max 9999, must be an integer, can be empty string
export const REPS_REGEX = /^(?:[0-9]{1,4})?$/;
export const REPS_MIN = 0;
export const REPS_MAX = 9999;

// Distance: min 0, max 9999, steps of 0.1, can be empty string, only 1 decimal
export const DISTANCE_REGEX = /^(\d{0,4})(\.(\d{0,1})?)?$/;
export const DISTANCE_MIN = 0;
export const DISTANCE_MAX = 9999;

// Duration minutes: min 0, max 9999, must be an integer, can be empty string
export const DURATION_MINUTES_REGEX = /^(?:[0-9]{1,4})?$/;
export const DURATION_MINUTES_MIN = 0;
export const DURATION_MINUTES_MAX = 9999;

// Duration seconds: min 0, max 59, must be an integer, can be empty string
export const DURATION_SECONDS_REGEX = /^(?:[0-9]{1,2})?$/;
export const DURATION_SECONDS_MIN = 0;
export const DURATION_SECONDS_MAX = 59;

// Effort rating: min 0, max 10, can be empty string.
// RPE allows steps of 0.5 (only 0 or 5 after the decimal); RIR is whole numbers only.
export const RPE_REGEX = /^(10|[0-9](\.\d{0,1})?)?$/;
export const RIR_REGEX = /^(10|[0-9])?$/;
export const EFFORT_RATING_MIN = 0;
export const EFFORT_RATING_MAX = 10;

// --- Calculator-specific rules ---
// The 1RM calculator uses different ranges than workout logging, since the
// estimation formulas are only considered reliable within these bounds.

// Calculator reps: min 1, max 10, must be an integer, can be empty string
export const CALCULATOR_REPS_REGEX = /^(10|[1-9])?$/;
export const CALCULATOR_REPS_MIN = 1;
export const CALCULATOR_REPS_MAX = 10;

// Calculator RPE: min 6, max 10, steps of 0.5, can be empty string
export const CALCULATOR_RPE_REGEX = /^(\d{0,2})(\.([05]?)?)?$/;
export const CALCULATOR_RPE_MIN = 6;
export const CALCULATOR_RPE_MAX = 10;

// Calculator RIR: min 0, max 4, must be an integer, can be empty string
export const CALCULATOR_RIR_REGEX = /^[0-4]?$/;
export const CALCULATOR_RIR_MIN = 0;
export const CALCULATOR_RIR_MAX = 4;
