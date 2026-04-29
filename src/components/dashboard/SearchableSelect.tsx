"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSearchOption } from "@/lib/types";

type SearchableSelectProps = {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  loadOptions: (query: string) => Promise<AdminSearchOption[]>;
  placeholder: string;
  noOptionsText: string;
  disabled?: boolean;
  onOptionSelect?: (option: AdminSearchOption) => void;
};

export function SearchableSelect({
  label,
  value,
  onChange,
  loadOptions,
  placeholder,
  noOptionsText,
  disabled = false,
  onOptionSelect,
}: SearchableSelectProps) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<AdminSearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      const result = await loadOptions(query.trim());
      if (!cancelled) {
        setOptions(result);
        setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, loadOptions]);

  const showEmpty = useMemo(
    () => open && !loading && query.trim().length > 0 && options.length === 0,
    [loading, open, options.length, query],
  );

  return (
    <div className="admin-select-wrap">
      <label className="admin-field-label">{label}</label>
      <input
        className="admin-field-input"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 80);
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          onChange(nextValue);
          setOpen(true);
        }}
      />
      {open ? (
        <div className="admin-select-dropdown">
          {loading ? <p className="state-text">...</p> : null}
          {!loading
            ? options.map(option => (
              <button
                key={String(option.value ?? option.id ?? option.name)}
                type="button"
                className="admin-select-option"
                onMouseDown={() => {
                  setQuery(option.name);
                  onChange(option.name);
                  onOptionSelect?.(option);
                  setOpen(false);
                }}
              >
                {option.name}
              </button>
            ))
            : null}
          {showEmpty ? <p className="state-text state-empty">{noOptionsText}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
