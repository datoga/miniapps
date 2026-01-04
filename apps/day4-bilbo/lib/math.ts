import type { UnitsUI } from "./schemas";

// Conversion constants
const KG_TO_LB = 2.20462;
const LB_TO_KG = 1 / KG_TO_LB;

/**
 * Convert a value to KG from the given units
 */
export function toKg(value: number, units: UnitsUI): number {
  if (units === "lb") {
    return value * LB_TO_KG;
  }
  return value;
}

/**
 * Convert KG to display units
 */
export function fromKg(kg: number, units: UnitsUI): number {
  if (units === "lb") {
    return kg * KG_TO_LB;
  }
  return kg;
}

/**
 * Format a number with exactly 2 decimal places
 */
export function format2(value: number): string {
  // Format with up to 2 decimal places, removing trailing zeros
  const fixed = value.toFixed(2);
  return parseFloat(fixed).toString();
}

/**
 * Round to the nearest step, rounding up if exactly half
 */
export function roundToStep(kg: number, stepKg: number): number {
  if (stepKg <= 0) {return kg;}

  const quotient = kg / stepKg;
  const lower = Math.floor(quotient) * stepKg;
  const upper = Math.ceil(quotient) * stepKg;

  const distToLower = kg - lower;
  const distToUpper = upper - kg;

  // If exactly half, round up
  if (Math.abs(distToLower - distToUpper) < 0.0001) {
    return upper;
  }

  // Otherwise round to nearest
  return distToLower < distToUpper ? lower : upper;
}

/**
 * Compute work (total volume) in kg
 */
export function computeWork(loadKg: number, reps: number): number {
  return loadKg * reps;
}

/**
 * Estimate 1RM using Epley formula (used by BilboTeam)
 * 1RM = weight × (1 + reps / 30)
 *
 * Reference: https://bilboteam.com/calculadora-rm-repeticion-maxima-1rm/
 */
export function estimate1RM(loadKg: number, reps: number): number {
  if (reps <= 0) {return loadKg;}
  if (reps === 1) {return loadKg;}

  return loadKg * (1 + reps / 30);
}

/**
 * Calculate suggested load for next session
 *
 * If no sessions in cycle: 50% of base1RMKg
 * Otherwise: last session load + increment, rounded to step
 */
export function calculateSuggestedLoad(
  base1RMKg: number,
  lastSessionLoadKg: number | null,
  incrementKg: number,
  roundStepKg: number
): number {
  if (lastSessionLoadKg === null) {
    // First session of cycle: 50% of base
    const suggested = 0.5 * base1RMKg;
    return roundToStep(suggested, roundStepKg);
  }

  // Subsequent sessions: last load + increment
  const suggested = lastSessionLoadKg + incrementKg;
  return roundToStep(suggested, roundStepKg);
}

/**
 * Format weight for display with units
 */
export function formatWeight(kg: number, units: UnitsUI): string {
  const displayValue = fromKg(kg, units);
  return `${format2(displayValue)} ${units}`;
}

