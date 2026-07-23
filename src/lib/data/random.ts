/**
 * Deterministic pseudo-random number generation.
 *
 * `Math.random()` would make every render produce different figures, which
 * breaks snapshot tests, E2E assertions, and server/client hydration. These
 * generators are pure functions of their seed, so the same seed always yields
 * the same dashboard.
 */

/** Mixes an arbitrary string into a well-distributed 32-bit seed. */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/**
 * mulberry32 — small, fast, and good enough for presentation data.
 * Returns a generator producing values in [0, 1).
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Uniform float in [min, max). */
export function randomBetween(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min)
}

/** Uniform integer in [min, max], inclusive on both ends. */
export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(randomBetween(rng, min, max + 1))
}

/**
 * Approximates a normal distribution by averaging four uniforms
 * (central limit theorem). Real metrics cluster around a mean; a flat uniform
 * distribution produces charts that look obviously synthetic.
 */
export function randomNormal(rng: () => number, mean: number, stdDev: number): number {
  const sum = rng() + rng() + rng() + rng()
  return mean + ((sum - 2) / 2) * stdDev * 2
}

/** Picks one element deterministically. Throws on an empty list. */
export function pick<T>(rng: () => number, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error("pick() requires a non-empty array")
  }
  return items[Math.floor(rng() * items.length)]!
}
