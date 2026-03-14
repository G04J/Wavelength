"use client";

import { useCallback, useRef, useState } from "react";

export type InterestSection = {
  id: string;
  label: string;
  placeholder: string;
};

/** Do not call suggestions API for queries shorter than this (avoids noise and race conditions). */
const MIN_QUERY_LENGTH = 2;

const styles = {
  section: {
    marginBottom: "1.25rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#3a1a1a",
  },
  optionalBadge: {
    fontSize: "0.75rem",
    color: "#b08080",
    fontWeight: 500,
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: 10,
    border: "1px solid #f0e0dc",
    fontSize: "1rem",
    boxSizing: "border-box" as const,
  },
  dropdown: {
    position: "absolute" as const,
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    background: "white",
    borderRadius: 10,
    border: "1px solid #f0e0dc",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    maxHeight: 220,
    overflowY: "auto" as const,
    zIndex: 10,
  },
  suggestionItem: {
    padding: "0.625rem 1rem",
    fontSize: "0.9375rem",
    color: "#3a1a1a",
    cursor: "pointer",
    borderBottom: "1px solid #f5ecea",
  },
  suggestionItemLast: {
    borderBottom: "none",
  },
  suggestionItemMuted: {
    color: "#b08080",
    cursor: "default",
  },
  suggestionError: {
    color: "#c04040",
    fontSize: "0.8125rem",
    padding: "0.625rem 1rem",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
    marginTop: "0.75rem",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.375rem 0.75rem",
    borderRadius: 8,
    background: "rgba(224, 96, 96, 0.12)",
    color: "#5a3a3a",
    fontSize: "0.8125rem",
  },
  tagRemove: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    color: "#b08080",
    fontSize: "1rem",
    lineHeight: 1,
  },
  inputWrap: {
    position: "relative" as const,
  },
  inputRow: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "stretch",
  },
  inputFlex: {
    flex: 1,
    minWidth: 0,
  },
  addBtn: {
    padding: "0.75rem 1rem",
    borderRadius: 10,
    border: "1px solid #e06060",
    background: "rgba(224, 96, 96, 0.08)",
    color: "#b05050",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  hint: {
    fontSize: "0.75rem",
    color: "#b08080",
    marginTop: "0.375rem",
  },
};

type Props = {
  section: InterestSection;
  selected: string[];
  onChange: (items: string[]) => void;
  /** When true, omit the section label/optional header (e.g. when used inside a dropdown that already shows the category). */
  hideLabel?: boolean;
};

export function SearchSection({ section, selected, onChange, hideLabel }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef("");
  queryRef.current = query;

  const fetchSuggestions = useCallback(async (q: string, category: string): Promise<string[]> => {
    setSuggestionsError(null);
    const res = await fetch("/api/profile/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, category }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = (data as { error?: string }).error ?? `Request failed (${res.status})`;
      console.warn("[SearchSection] suggestions API error:", res.status, data);
      setSuggestionsError(msg);
      return [];
    }

    const list = Array.isArray((data as { suggestions?: string[] }).suggestions)
      ? (data as { suggestions: string[] }).suggestions
      : [];
    return list;
  }, []);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setQuery(q);
      setSuggestionsError(null);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!q.trim()) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      if (q.trim().length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const trimmed = q.trim();
        setLoading(true);
        setOpen(true);
        setSuggestionsError(null);
        try {
          const results = await fetchSuggestions(trimmed, section.label);
          if (queryRef.current.trim() === trimmed) {
            setSuggestions(Array.isArray(results) ? results : []);
          }
        } catch (err) {
          if (queryRef.current.trim() === trimmed) {
            setSuggestionsError("Request failed");
            setSuggestions([]);
          }
        } finally {
          setLoading(false);
        }
      }, 400);
    },
    [section.label, fetchSuggestions]
  );

  const addItem = useCallback(
    (item: string) => {
      const trimmed = item.trim();
      if (!trimmed || selected.includes(trimmed)) return;
      onChange([...selected, trimmed]);
      setQuery("");
      setSuggestions([]);
      setOpen(false);
      setSuggestionsError(null);
      inputRef.current?.focus();
    },
    [selected, onChange]
  );

  const removeItem = useCallback(
    (item: string) => {
      onChange(selected.filter((x) => x !== item));
    },
    [selected, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim()) addItem(query.trim());
    }
    if (e.key === "Escape") setOpen(false);
  };

  const handleAddTyped = () => {
    if (query.trim()) addItem(query.trim());
  };

  const showDropdown = open && (loading || suggestions.length > 0 || suggestionsError != null);

  return (
    <div style={styles.section}>
      {!hideLabel && (
        <div style={styles.header}>
          <h3 style={styles.label}>{section.label}</h3>
          <span style={styles.optionalBadge}>optional</span>
        </div>
      )}

      <div style={styles.inputWrap}>
        <div style={styles.inputRow}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => (suggestions.length > 0 || loading || suggestionsError) && setOpen(true)}
            placeholder={section.placeholder}
            autoComplete="off"
            style={{ ...styles.input, ...styles.inputFlex }}
          />
          <button type="button" onClick={handleAddTyped} style={styles.addBtn}>
            Add
          </button>
        </div>

        {showDropdown && (
          <div style={styles.dropdown}>
            {loading ? (
              <div style={{ ...styles.suggestionItem, ...styles.suggestionItemMuted }}>
                Searching…
              </div>
            ) : suggestionsError ? (
              <div style={{ ...styles.suggestionItem, ...styles.suggestionError }}>
                {suggestionsError}
              </div>
            ) : suggestions.length === 0 ? (
              <div style={{ ...styles.suggestionItem, ...styles.suggestionItemMuted }}>
                No suggestions. Try different words or add your own above.
              </div>
            ) : (
              suggestions.map((item, i) => (
                <div
                  key={item}
                  style={{
                    ...styles.suggestionItem,
                    ...(i === suggestions.length - 1 ? styles.suggestionItemLast : {}),
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addItem(item);
                  }}
                >
                  {item}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <p style={styles.hint}>
        Type at least {MIN_QUERY_LENGTH} characters for suggestions. Press Enter or click Add to add your own.
      </p>

      <div style={styles.tags}>
        {selected.map((item) => (
          <span key={item} style={styles.tag}>
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              style={styles.tagRemove}
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
