import * as React from "react"

const Card = React.forwardRef(({ className, style, glowColor, hoverable = true, ...props }, ref) => {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      ref={ref}
      className={className}
      onMouseEnter={hoverable ? () => setHovered(true) : undefined}
      onMouseLeave={hoverable ? () => setHovered(false) : undefined}
      style={{
        background: hovered ? "var(--bg-card-hover)" : "var(--bg-card)",
        border: `1px solid ${hovered && glowColor ? `${glowColor}40` : "var(--border-subtle)"}`,
        borderRadius: "16px",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: hoverable && hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered
          ? glowColor
            ? `0 8px 32px ${glowColor}25, var(--shadow-md)`
            : "var(--shadow-md)"
          : "var(--shadow-sm)",
        ...style,
      }}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={className}
    style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "24px 24px 0", ...style }}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, style, ...props }, ref) => (
  <h3
    ref={ref}
    className={className}
    style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.3, ...style }}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, style, ...props }, ref) => (
  <p
    ref={ref}
    className={className}
    style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.6, ...style }}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={className}
    style={{ padding: "20px 24px 24px", ...style }}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, style, ...props }, ref) => (
  <div
    ref={ref}
    className={className}
    style={{ display: "flex", alignItems: "center", padding: "0 24px 24px", gap: "12px", ...style }}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
