import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select option',
  emptyText = 'No options found',
  disabled = false,
  loading = false,
  className
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return options;
    return options.filter((option) => option.label.toLowerCase().includes(text));
  }, [options, query]);

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="h-10 w-full rounded-md border border-stone-brown-100 bg-white px-3 text-left text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-center justify-between gap-2">
          <span className={cn(!selectedOption && 'text-silver-400')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={16} className="text-silver-500" />
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-md border border-stone-brown-100 bg-white shadow-lg">
          <div className="border-b border-stone-brown-100 px-3 py-2">
            <div className="flex items-center gap-2 text-silver-500">
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-stone-brown-900 outline-none placeholder:text-silver-400"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1">
            {loading ? (
              <div className="px-2 py-2 text-sm text-silver-500">Loading...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-sm text-silver-500">{emptyText}</div>
            ) : (
              filteredOptions.map((option) => {
                const active = String(option.value) === String(value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm text-stone-brown-900 hover:bg-stone-brown-50"
                  >
                    <span>{option.label}</span>
                    {active && <Check size={14} className="text-toasted-almond-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
