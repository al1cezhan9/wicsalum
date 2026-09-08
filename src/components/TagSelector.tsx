import { useState, useRef, useEffect } from 'react';

export const PRESET_TAGS = [
  'Machine Learning', 'AI / LLMs', 'Software Engineering', 'Web Development',
  'Mobile Development', 'Data Science', 'Cybersecurity', 'Systems / Infrastructure',
  'Distributed Systems', 'Computer Vision', 'NLP', 'Robotics',
  'Product Management', 'UX / Design', 'Quantitative Finance',
  'Blockchain / Web3', 'Game Development', 'DevOps / Cloud',
  'Research', 'Entrepreneurship', 'Open Source',
];

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function TagSelector({ selected, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = PRESET_TAGS.filter(
    t => t.toLowerCase().includes(query.toLowerCase()) && !selected.includes(t)
  );

  const trimmed = query.trim();
  const canAddCustom =
    trimmed.length > 0 &&
    !PRESET_TAGS.some(t => t.toLowerCase() === trimmed.toLowerCase()) &&
    !selected.some(t => t.toLowerCase() === trimmed.toLowerCase());

  const addTag = (tag: string) => {
    onChange([...selected, tag]);
    setQuery('');
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(selected.filter(t => t !== tag));
  };

  return (
    <div>
      <label className="field-label">Areas of Expertise / Interest</label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(tag => (
            <span key={tag} className="chip">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                style={{
                  background: 'none', border: 'none', padding: 0, marginLeft: 2,
                  color: 'var(--plum-700)', cursor: 'pointer', lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div ref={containerRef} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search or type a custom tag..."
          className="input-plum"
        />

        {open && (filtered.length > 0 || canAddCustom) && (
          <ul
            className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto list-none"
            style={{
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(46, 26, 71, 0.12)',
              padding: 0, margin: 0,
            }}
          >
            {filtered.map(tag => (
              <li key={tag}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); addTag(tag); }}
                  className="w-full text-left px-3 py-2 text-sm"
                  style={{
                    background: 'white', border: 'none', color: 'var(--ink)',
                    cursor: 'pointer', fontFamily: 'Lato, sans-serif',
                  }}
                >
                  {tag}
                </button>
              </li>
            ))}
            {canAddCustom && (
              <li>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); addTag(trimmed); }}
                  className="w-full text-left px-3 py-2 text-sm font-bold"
                  style={{
                    background: 'var(--plum-50)',
                    color: 'var(--plum-700)',
                    borderTop: '1px solid var(--line)',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Lato, sans-serif',
                  }}
                >
                  + Add "{trimmed}"
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
