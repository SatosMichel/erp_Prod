import * as React from "react"

const Input = React.forwardRef(({
  className,
  type,
  style,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  error,
  label,
  hint,
  wrapperStyle,
  ...props
}, ref) => {
  const [focused, setFocused] = React.useState(false)

  const inputEl = (
    <input
      type={type}
      ref={ref}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: "100%",
        padding: LeadingIcon ? "11px 14px 11px 40px" : TrailingIcon ? "11px 40px 11px 14px" : "11px 14px",
        background: "var(--bg-elevated)",
        border: `1.5px solid ${error ? "#f43f5e" : focused ? "var(--accent-indigo)" : "var(--border-default)"}`,
        borderRadius: "10px",
        color: "var(--text-primary)",
        fontSize: "14px",
        fontFamily: "inherit",
        outline: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: error
          ? "0 0 0 3px rgba(244,63,94,0.12)"
          : focused
            ? "0 0 0 3px rgba(99,102,241,0.15)"
            : "none",
        ...style,
      }}
      className={className}
      {...props}
    />
  )

  if (!label && !LeadingIcon && !TrailingIcon && !hint && !error) return inputEl

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", ...wrapperStyle }}>
      {label && (
        <label style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", width: "100%" }}>
        {LeadingIcon && (
          <div style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: focused ? "var(--accent-indigo)" : "var(--text-muted)", transition: "color 0.2s", display: "flex", pointerEvents: "none" }}>
            <LeadingIcon size={15} />
          </div>
        )}
        {inputEl}
        {TrailingIcon && (
          <div style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex", pointerEvents: "none" }}>
            <TrailingIcon size={15} />
          </div>
        )}
      </div>
      {(hint || error) && (
        <span style={{ fontSize: "12px", color: error ? "#f43f5e" : "var(--text-muted)" }}>
          {error || hint}
        </span>
      )}
    </div>
  )
})

Input.displayName = "Input"

export { Input }
