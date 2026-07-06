import React, { useState, useRef, useEffect } from 'react';
import { searchLocations } from '../lib/locations';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Type a city, state, or country...',
  required,
  id,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setSuggestions(searchLocations(val));
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleFocus = () => {
    setSuggestions(searchLocations(value));
    setOpen(true);
  };

  const handleSelect = (location: string) => {
    onChange(location);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        id={id}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="input-plum"
      />
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto list-none"
          style={{
            background: 'white',
            border: '1px solid var(--line)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(46, 26, 71, 0.12)',
            padding: 0, margin: 0, top: '100%',
          }}
        >
          {suggestions.map((loc, i) => (
            <li
              key={loc}
              onMouseDown={() => handleSelect(loc)}
              className="px-3 py-2 text-sm cursor-pointer"
              style={{
                background: i === activeIndex ? 'var(--plum-50)' : 'white',
                color: i === activeIndex ? 'var(--plum-700)' : 'var(--ink)',
                listStyle: 'none',
              }}
            >
              {loc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationAutocomplete;
