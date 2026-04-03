import { useState, useRef, useEffect } from 'react';

const PRESET_TAGS = [
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Areas of Expertise / Interest
      </label>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-purple-900 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div ref={containerRef} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search or type a custom tag..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />

        {open && (filtered.length > 0 || canAddCustom) && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filtered.map(tag => (
              <li key={tag}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); addTag(tag); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700"
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
                  className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 font-medium border-t border-gray-100"
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
