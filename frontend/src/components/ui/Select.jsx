import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

/**
 * Select customizado elegante — substitui o <select> nativo do browser.
 *
 * Props:
 *   value        — valor selecionado (string | number)
 *   onChange     — fn(newValue) chamada ao selecionar
 *   options      — array de { value, label, icon?: ReactNode, disabled?: bool }
 *   placeholder  — texto quando vazio
 *   label        — rótulo acima
 *   error        — mensagem de erro (string)
 *   hint         — dica abaixo do campo
 *   disabled     — desabilita o select
 *   searchable   — habilita busca inline (default: false)
 *   style        — estilo extra no wrapper
 */
export function Select({
  value,
  onChange,
  options = [],
  placeholder = "Selecione...",
  label,
  error,
  hint,
  disabled = false,
  searchable = false,
  style,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [focused, setFocused] = useState(false)
  const containerRef = useRef(null)
  const searchRef = useRef(null)

  const selected = options.find(o => o.value === value)

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Focar busca ao abrir
  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open, searchable])

  const filtered = searchable && search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const handleSelect = (opt) => {
    if (opt.disabled) return
    onChange(opt.value)
    setOpen(false)
    setSearch("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Escape") { setOpen(false); setSearch("") }
    if (e.key === "Enter" || e.key === " ") { if (!open) setOpen(true) }
  }

  const borderColor = error
    ? "#f43f5e"
    : focused || open
      ? "var(--accent-indigo)"
      : "var(--border-default)"

  const boxShadow = error
    ? "0 0 0 3px rgba(244,63,94,0.12)"
    : (focused || open)
      ? "0 0 0 3px rgba(99,102,241,0.15)"
      : "none"

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", flexDirection: "column", gap: "6px", position: "relative", width: "100%", ...style }}
    >
      {label && (
        <label style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}>
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          width: "100%",
          padding: "11px 14px",
          background: "var(--bg-elevated)",
          border: `1.5px solid ${borderColor}`,
          borderRadius: open ? "10px 10px 0 0" : "10px",
          color: selected ? "var(--text-primary)" : "var(--text-muted)",
          fontSize: "14px",
          fontFamily: "inherit",
          fontWeight: selected ? 500 : 400,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.55 : 1,
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s, border-radius 0.15s",
          boxShadow,
          textAlign: "left",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
          {selected?.icon && (
            <span style={{ flexShrink: 0, display: "flex", color: "var(--accent-indigo)" }}>
              {selected.icon}
            </span>
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "var(--bg-elevated)",
            border: `1.5px solid var(--accent-indigo)`,
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            boxShadow: "var(--shadow-lg), 0 0 0 1px rgba(99,102,241,0.10)",
            maxHeight: "260px",
            overflowY: "auto",
            animation: "slideDown 0.2s cubic-bezier(0.4,0,0.2,1) both",
          }}
        >
          {/* Busca inline */}
          {searchable && (
            <div style={{ padding: "10px 10px 6px", borderBottom: "1px solid var(--border-subtle)" }}>
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "7px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* Opções */}
          {filtered.length === 0 ? (
            <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>
              Nenhuma opção encontrada
            </div>
          ) : (
            filtered.map((opt, idx) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value ?? idx}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "10px 14px",
                    background: isSelected ? "rgba(99,102,241,0.12)" : "transparent",
                    color: isSelected ? "var(--accent-indigo)" : opt.disabled ? "var(--text-muted)" : "var(--text-primary)",
                    border: "none",
                    cursor: opt.disabled ? "not-allowed" : "pointer",
                    fontSize: "13.5px",
                    fontFamily: "inherit",
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: "left",
                    transition: "background 0.15s",
                    opacity: opt.disabled ? 0.5 : 1,
                  }}
                  onMouseOver={e => { if (!isSelected && !opt.disabled) e.currentTarget.style.background = "var(--bg-card-hover)" }}
                  onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? "rgba(99,102,241,0.12)" : "transparent" }}
                >
                  {opt.icon && (
                    <span style={{ flexShrink: 0, display: "flex", color: isSelected ? "var(--accent-indigo)" : "var(--text-muted)" }}>
                      {opt.icon}
                    </span>
                  )}
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {opt.label}
                  </span>
                  {isSelected && <Check size={14} style={{ flexShrink: 0 }} />}
                </button>
              )
            })
          )}
        </div>
      )}

      {(hint || error) && (
        <span style={{ fontSize: "12px", color: error ? "#f43f5e" : "var(--text-muted)" }}>
          {error || hint}
        </span>
      )}
    </div>
  )
}
