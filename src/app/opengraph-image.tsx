import { ImageResponse } from "next/og"

import { siteConfig } from "@/config/site"

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Social preview card, generated at build time.
 *
 * Satori (which backs ImageResponse) supports only a subset of CSS — no CSS
 * variables, no Tailwind classes, no external assets. Everything here is
 * therefore inline with literal values.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "linear-gradient(135deg, #17171a 0%, #1e1e22 55%, #104281 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Inline SVG: Satori cannot load an icon component or a remote file. */}
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#17171a"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M3 3v18h18" />
            <path d="M7 16v-5" />
            <path d="M12 16V7" />
            <path d="M17 16v-8" />
          </svg>
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em" }}>
          {siteConfig.name}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          Know what your audience actually did.
        </div>
        <div
          style={{ fontSize: 28, color: "rgba(255,255,255,0.66)", maxWidth: 860, lineHeight: 1.4 }}
        >
          Production-grade analytics dashboard starter kit for Next.js — typed, tested, and
          accessible by construction.
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"].map((color) => (
          <div key={color} style={{ width: 96, height: 8, borderRadius: 4, background: color }} />
        ))}
      </div>
    </div>,
    size
  )
}
