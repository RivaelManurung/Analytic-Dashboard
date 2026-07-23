import { chartColor } from "@/lib/format"

interface SparklineProps {
  values: number[]
  colorSlot: number
  width?: number
  height?: number
  className?: string
}

/**
 * Miniature trend line.
 *
 * Hand-rolled SVG rather than a charting library: this renders once per metric
 * card, and pulling Recharts in for a 64px glyph would cost far more than it
 * is worth. Marked `aria-hidden` — the card already states the trend in words.
 */
export function Sparkline({
  values,
  colorSlot,
  width = 72,
  height = 32,
  className,
}: SparklineProps) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    // A flat series would divide by zero; centre it instead.
    const y = span === 0 ? height / 2 : height - ((value - min) / span) * height
    return { x, y }
  })

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ")
  const area = `${line} L${width} ${height} L0 ${height} Z`

  const color = chartColor(colorSlot)
  const gradientId = `sparkline-${colorSlot}-${values.length}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
