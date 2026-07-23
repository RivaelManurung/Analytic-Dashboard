import { vi } from "vitest"

/**
 * Shared test setup.
 *
 * Files that opt into the Node environment with `@vitest-environment node`
 * (crypto, JWT signing) have no DOM, so everything below is guarded. Without
 * the guard, importing this file would throw `window is not defined` and those
 * suites would never run.
 */
const isBrowserLike = typeof window !== "undefined"

if (isBrowserLike) {
  await import("@testing-library/jest-dom/vitest")

  const { cleanup } = await import("@testing-library/react")
  const { afterEach } = await import("vitest")

  afterEach(() => {
    cleanup()
  })

  // jsdom implements neither matchMedia nor ResizeObserver, and both are
  // required by next-themes, the sidebar breakpoint hook, and Recharts.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })

  /**
   * ResizeObserver that immediately reports a fixed box.
   *
   * jsdom performs no layout, so every element measures 0x0 and Recharts'
   * ResponsiveContainer renders nothing at all. A stub that merely swallows
   * `observe()` is not enough — the callback has to fire with a real size for
   * the chart to lay itself out.
   */
  const STUB_WIDTH = 1024
  const STUB_HEIGHT = 480

  class ResizeObserverStub {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element) {
      const entry = {
        target,
        contentRect: {
          width: STUB_WIDTH,
          height: STUB_HEIGHT,
          top: 0,
          left: 0,
          right: STUB_WIDTH,
          bottom: STUB_HEIGHT,
          x: 0,
          y: 0,
        },
      } as unknown as ResizeObserverEntry

      this.callback([entry], this as unknown as ResizeObserver)
    }

    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)

  class IntersectionObserverStub {
    readonly root = null
    readonly rootMargin = ""
    readonly thresholds: readonly number[] = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub)

  // Recharts also reads getBoundingClientRect directly in places.
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return {
      width: STUB_WIDTH,
      height: STUB_HEIGHT,
      top: 0,
      left: 0,
      right: STUB_WIDTH,
      bottom: STUB_HEIGHT,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect
  }

  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: STUB_WIDTH,
  })
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: STUB_HEIGHT,
  })

  window.scrollTo = vi.fn()

  // jsdom does not implement scrollIntoView; cmdk calls it to keep the active
  // command palette item in view.
  Element.prototype.scrollIntoView = vi.fn()
}
