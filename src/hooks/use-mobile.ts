import { useCallback, useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Tracks whether the viewport is below the mobile breakpoint.
 *
 * Uses `useSyncExternalStore` rather than useState + useEffect: matchMedia is
 * an external store, and reading it through this hook means React never renders
 * a stale value, there is no setState-in-effect cascade, and the server
 * snapshot is explicit rather than an accidental `undefined`.
 */
export function useIsMobile(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const query = window.matchMedia(QUERY)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    // The server has no viewport. Desktop-first is the safer assumption: it
    // keeps the sidebar in the initial HTML rather than flashing it in.
    () => false
  )
}
