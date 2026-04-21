import * as React from "react"
import { Loader2 } from "lucide-react"

const variantStyles = {
  primary: {
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    color: "#fff",
    border: "none",
    boxShadow: "0 4px 16px rgba(59,130,246,0.30)",
  },
  secondary: {
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    border: "1.5px solid var(--border-default)",
    boxShadow: "none",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1.5px solid transparent",
    boxShadow: "none",
  },
  danger: {
    background: "rgba(244,63,94,0.10)",
    color: "#f43f5e",
    border: "1.5px solid rgba(244,63,94,0.25)",
    boxShadow: "none",
  },
  success: {
    background: "rgba(16,185,129,0.10)",
    color: "#10b981",
    border: "1.5px solid rgba(16,185,129,0.25)",
    boxShadow: "none",
  },
  // Compatibilidade legada
  default:     { background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1.5px solid var(--border-default)", boxShadow: "none" },
  destructive: { background: "rgba(244,63,94,0.10)", color: "#f43f5e", border: "1.5px solid rgba(244,63,94,0.25)", boxShadow: "none" },
  outline:     { background: "transparent", color: "var(--text-secondary)", border: "1.5px solid var(--border-default)", boxShadow: "none" },
  link:        { background: "transparent", color: "var(--accent-blue)", border: "none", boxShadow: "none", textDecoration: "underline" },
}

const sizeStyles = {
  sm:      { padding: "7px 14px", fontSize: "12px", borderRadius: "8px" },
  default: { padding: "10px 20px", fontSize: "14px", borderRadius: "10px" },
  lg:      { padding: "13px 28px", fontSize: "15px", borderRadius: "12px" },
  icon:    { padding: "9px", fontSize: "14px", borderRadius: "10px", width: "38px", height: "38px" },
}

const Button = React.forwardRef(({
  variant = "primary",
  size = "default",
  loading = false,
  disabled = false,
  children,
  style,
  onMouseOver,
  onMouseOut,
  ...props
}, ref) => {
  const [hovered, setHovered] = React.useState(false)
  const vStyle = variantStyles[variant] || variantStyles.primary
  const sStyle = sizeStyles[size] || sizeStyles.default

  const isDisabled = disabled || loading

  const hoverExtra = hovered && !isDisabled ? (() => {
    if (variant === "primary" || variant === "default") return { filter: "brightness(1.12)", transform: "translateY(-1px)", boxShadow: "0 6px 24px rgba(59,130,246,0.45)" }
    if (variant === "ghost" || variant === "outline") return { background: "var(--bg-elevated)", borderColor: "var(--border-default)", color: "var(--text-primary)" }
    if (variant === "danger" || variant === "destructive") return { background: "rgba(244,63,94,0.18)" }
    if (variant === "success") return { background: "rgba(16,185,129,0.18)" }
    if (variant === "secondary") return { borderColor: "var(--accent-indigo)", color: "var(--accent-indigo)" }
    return {}
  })() : {}

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      onMouseOver={e => { setHovered(true); onMouseOver?.(e) }}
      onMouseOut={e => { setHovered(false); onMouseOut?.(e) }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        fontFamily: "inherit",
        fontWeight: 600,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.55 : 1,
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        whiteSpace: "nowrap",
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
        ...vStyle,
        ...sStyle,
        ...hoverExtra,
        ...style,
      }}
      {...props}
    >
      {loading && <Loader2 size={14} className="spin" style={{ animation: "spin 0.9s linear infinite" }} />}
      {children}
    </button>
  )
})

Button.displayName = "Button"

export { Button }
