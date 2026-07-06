import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserProfile, getUserRole, UserProfile, signOut } from '../lib/auth';
import ProfileCard from '../components/ProfileCard';
import ProfileModal from '../components/ProfileModal';
import { getFavorites } from '../utils/favorites';
import { LOCATIONS } from '../lib/locations';
import { PRESET_TAGS } from '../components/TagSelector';

const DirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterBio, setFilterBio] = useState('');
  const [filterInterests, setFilterInterests] = useState<string[]>([]);

  const [interestInput, setInterestInput] = useState('');
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestActiveIndex, setInterestActiveIndex] = useState(-1);
  const interestContainerRef = useRef<HTMLDivElement>(null);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyActiveIndex, setCompanyActiveIndex] = useState(-1);
  const companyContainerRef = useRef<HTMLDivElement>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityActiveIndex, setCityActiveIndex] = useState(-1);
  const cityContainerRef = useRef<HTMLDivElement>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [directoryView, setDirectoryView] = useState<'all' | 'saved'>('all');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const companies = useMemo(
    () => Array.from(new Set(profiles.map(p => p.current_company).filter(Boolean))).sort(),
    [profiles]
  );
  const years = useMemo(
    () => Array.from(new Set(profiles.map(p => p.graduation_year))).sort((a, b) => b - a),
    [profiles]
  );
  const sectors = useMemo(
    () => Array.from(new Set(profiles.map(p => p.sector).filter(Boolean))).sort(),
    [profiles]
  );
  const allInterests = useMemo(() => {
    const profileTags = Array.from(new Set(profiles.flatMap(p => p.tags ?? [])));
    return Array.from(new Set([...PRESET_TAGS, ...profileTags])).sort();
  }, [profiles]);

  const interestSuggestions = useMemo(
    () =>
      allInterests.filter(
        t => t.toLowerCase().includes(interestInput.toLowerCase()) && !filterInterests.includes(t)
      ),
    [allInterests, interestInput, filterInterests]
  );
  const companySuggestions = useMemo(
    () => companies.filter(c => c.toLowerCase().includes(filterCompany.toLowerCase())),
    [companies, filterCompany]
  );
  const citySuggestions = useMemo(
    () => [...LOCATIONS].sort().filter(c => c.toLowerCase().includes(filterCity.toLowerCase())),
    [filterCity]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (interestContainerRef.current && !interestContainerRef.current.contains(e.target as Node))
        setInterestOpen(false);
      if (companyContainerRef.current && !companyContainerRef.current.contains(e.target as Node))
        setCompanyOpen(false);
      if (cityContainerRef.current && !cityContainerRef.current.contains(e.target as Node))
        setCityOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) { navigate('/signup'); return; }
      setUserProfile(await getUserProfile());
      const role = await getUserRole();
      setIsAdmin(role?.role === 'admin');
      await loadProfiles();
    })();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles').select('*').order('name', { ascending: true });
    if (error) console.error('Error loading profiles:', error);
    setProfiles(data || []);
    setLoading(false);
  };

  const filteredProfiles = useMemo(() => {
    const savedIds = directoryView === 'saved' ? new Set(getFavorites()) : null;
    return profiles.filter(profile => {
      if (savedIds && !savedIds.has(profile.id)) return false;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        profile.name.toLowerCase().includes(q) ||
        profile.current_company.toLowerCase().includes(q) ||
        (profile.sector && profile.sector.toLowerCase().includes(q));
      const matchesCompany =
        !filterCompany || profile.current_company.toLowerCase().includes(filterCompany.toLowerCase());
      const matchesYear = !filterYear || profile.graduation_year.toString() === filterYear;
      const matchesCity =
        !filterCity || profile.current_city.toLowerCase().includes(filterCity.toLowerCase());
      const matchesSector = !filterSector || profile.sector === filterSector;
      const matchesBio =
        !filterBio || (profile.bio && profile.bio.toLowerCase().includes(filterBio.toLowerCase()));
      const matchesInterest =
        filterInterests.length === 0 ||
        filterInterests.some(tag => (profile.tags ?? []).includes(tag));
      return matchesSearch && matchesCompany && matchesYear && matchesCity && matchesSector && matchesBio && matchesInterest;
    });
  }, [
    profiles, directoryView, searchQuery, filterCompany, filterYear,
    filterCity, filterSector, filterBio, filterInterests,
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCompany('');
    setFilterYear('');
    setFilterCity('');
    setFilterSector('');
    setFilterBio('');
    setFilterInterests([]);
    setInterestInput('');
  };

  const hasActiveFilters =
    !!searchQuery || !!filterCompany || !!filterYear || !!filterCity ||
    !!filterSector || !!filterBio || filterInterests.length > 0;

  const handleSignOut = async () => {
    await signOut();
    navigate('/signup');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <header
        className="sticky top-0 z-40"
        style={{ background: '#A597D2', borderBottom: '1px solid #8B6AD9' }}
      >
        <div
          className="max-w-7xl mx-auto flex items-center justify-between"
          style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
        >
          <div>
            <h1 className="font-black" style={{ fontSize: '1.4rem', color: '#FFFFFF' }}>
              WiCS Alumni Directory
            </h1>
            <p className="text-sm mt-1 font-black" style={{ color: '#FFFFFF', opacity: 0.85 }}>
              {profiles.length} member{profiles.length === 1 ? '' : 's'}
            </p>
          </div>
          <nav className="flex items-center gap-1">
            {isAdmin && <NavButton onClick={() => navigate('/admin')}>Admin</NavButton>}
            {userProfile && <NavButton onClick={() => navigate('/profile')}>My Profile</NavButton>}
            <NavButton onClick={handleSignOut}>Sign Out</NavButton>
          </nav>
        </div>
      </header>

      <main
        className="max-w-7xl mx-auto"
        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', paddingTop: '3rem', paddingBottom: '3rem' }}
      >
        <section className="card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
          <div
            className="flex flex-col md:flex-row md:items-center"
            style={{ gap: '1.5rem', marginBottom: '2.5rem' }}
          >
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, company, or sector"
                className="input-plum"
              />
            </div>
            <div className="seg-toggle">
              <SegButton active={directoryView === 'all'} onClick={() => setDirectoryView('all')}>
                All
              </SegButton>
              <SegButton active={directoryView === 'saved'} onClick={() => setDirectoryView('saved')}>
                Saved
              </SegButton>
            </div>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            style={{ columnGap: '1.5rem', rowGap: '2rem' }}
          >
            <FilterField label="Company">
              <div ref={companyContainerRef} className="relative">
                <input
                  type="text"
                  value={filterCompany}
                  onChange={e => { setFilterCompany(e.target.value); setCompanyOpen(true); setCompanyActiveIndex(-1); }}
                  onFocus={() => setCompanyOpen(true)}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setCompanyOpen(true);
                      setCompanyActiveIndex(i => Math.min(i + 1, companySuggestions.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setCompanyActiveIndex(i => Math.max(i - 1, -1));
                    } else if (e.key === 'Enter' && companyActiveIndex >= 0) {
                      e.preventDefault();
                      setFilterCompany(companySuggestions[companyActiveIndex]);
                      setCompanyOpen(false); setCompanyActiveIndex(-1);
                    } else if (e.key === 'Escape') setCompanyOpen(false);
                  }}
                  placeholder="Any"
                  autoComplete="off"
                  className="input-plum"
                />
                {companyOpen && companySuggestions.length > 0 && (
                  <Dropdown>
                    {companySuggestions.map((c, i) => (
                      <DropdownItem
                        key={c}
                        active={i === companyActiveIndex}
                        onMouseDown={e => { e.preventDefault(); setFilterCompany(c); setCompanyOpen(false); }}
                      >
                        {c}
                      </DropdownItem>
                    ))}
                  </Dropdown>
                )}
              </div>
            </FilterField>

            <FilterField label="Graduation Year">
              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="input-plum"
              >
                <option value="">Any year</option>
                {years.map(y => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label="City">
              <div ref={cityContainerRef} className="relative">
                <input
                  type="text"
                  value={filterCity}
                  onChange={e => { setFilterCity(e.target.value); setCityOpen(true); setCityActiveIndex(-1); }}
                  onFocus={() => setCityOpen(true)}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setCityOpen(true);
                      setCityActiveIndex(i => Math.min(i + 1, citySuggestions.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setCityActiveIndex(i => Math.max(i - 1, -1));
                    } else if (e.key === 'Enter' && cityActiveIndex >= 0) {
                      e.preventDefault();
                      setFilterCity(citySuggestions[cityActiveIndex]);
                      setCityOpen(false); setCityActiveIndex(-1);
                    } else if (e.key === 'Escape') setCityOpen(false);
                  }}
                  placeholder="Any"
                  autoComplete="off"
                  className="input-plum"
                />
                {cityOpen && citySuggestions.length > 0 && (
                  <Dropdown>
                    {citySuggestions.map((c, i) => (
                      <DropdownItem
                        key={c}
                        active={i === cityActiveIndex}
                        onMouseDown={e => { e.preventDefault(); setFilterCity(c); setCityOpen(false); }}
                      >
                        {c}
                      </DropdownItem>
                    ))}
                  </Dropdown>
                )}
              </div>
            </FilterField>

            <FilterField label="Sector">
              <select
                value={filterSector}
                onChange={e => setFilterSector(e.target.value)}
                className="input-plum"
              >
                <option value="">Any sector</option>
                {sectors.map(s => (
                  s ? <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option> : null
                ))}
              </select>
            </FilterField>

            <FilterField label="Interests">
              <div ref={interestContainerRef} className="relative">
                <input
                  type="text"
                  value={interestInput}
                  onChange={e => { setInterestInput(e.target.value); setInterestOpen(true); setInterestActiveIndex(-1); }}
                  onFocus={() => setInterestOpen(true)}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setInterestOpen(true);
                      setInterestActiveIndex(i => Math.min(i + 1, interestSuggestions.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setInterestActiveIndex(i => Math.max(i - 1, -1));
                    } else if (e.key === 'Enter' && interestActiveIndex >= 0) {
                      e.preventDefault();
                      setFilterInterests(prev => [...prev, interestSuggestions[interestActiveIndex]]);
                      setInterestInput(''); setInterestActiveIndex(-1);
                    } else if (e.key === 'Escape') setInterestOpen(false);
                    else if (e.key === 'Backspace' && interestInput === '' && filterInterests.length > 0) {
                      setFilterInterests(prev => prev.slice(0, -1));
                    }
                  }}
                  placeholder="Any"
                  autoComplete="off"
                  className="input-plum"
                />
                {interestOpen && interestSuggestions.length > 0 && (
                  <Dropdown>
                    {interestSuggestions.map((t, i) => (
                      <DropdownItem
                        key={t}
                        active={i === interestActiveIndex}
                        onMouseDown={e => { e.preventDefault(); setFilterInterests(prev => [...prev, t]); setInterestInput(''); }}
                      >
                        {t}
                      </DropdownItem>
                    ))}
                  </Dropdown>
                )}
              </div>
            </FilterField>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <FilterField label="Bio keyword">
              <input
                type="text"
                value={filterBio}
                onChange={e => setFilterBio(e.target.value)}
                placeholder="e.g. mentorship, startups, research"
                className="input-plum"
              />
            </FilterField>
          </div>

          {(filterInterests.length > 0 || hasActiveFilters) && (
            <div
              className="flex items-center flex-wrap gap-2"
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--line)',
              }}
            >
              {filterInterests.map(tag => (
                <span key={tag} className="chip">
                  {tag}
                  <button
                    onClick={() => setFilterInterests(prev => prev.filter(t => t !== tag))}
                    style={{ background: 'none', border: 'none', padding: 0, marginLeft: 2, color: 'var(--plum-700)', cursor: 'pointer', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold ml-auto"
                  style={{ background: 'none', border: 'none', color: 'var(--plum-700)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </section>

        <div
          className="flex items-baseline justify-between"
          style={{ marginBottom: '1.5rem' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Showing{' '}
            <span className="font-bold" style={{ color: 'var(--plum-900)' }}>
              {filteredProfiles.length}
            </span>{' '}
            of {profiles.length}
          </p>
        </div>

        {loading ? (
          <div className="card p-16 text-center" style={{ color: 'var(--muted)' }}>
            Loading directory…
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="card p-16 text-center">
            <p style={{ color: 'var(--muted)' }}>No members found matching your criteria.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm font-bold"
                style={{ background: 'none', border: 'none', color: 'var(--plum-700)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="card-grid">
            {filteredProfiles.map(profile => (
              <ProfileCard key={profile.id} profile={profile} onOpen={setSelectedProfile} />
            ))}
          </div>
        )}
      </main>

      <ProfileModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </div>
  );
};

const NavButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="text-base font-black px-3 py-1.5 rounded-md"
    style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}
  >
    {children}
  </button>
);

const SegButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="text-base font-black px-4 py-1.5 rounded-md"
    style={{
      background: active ? '#A597D2' : 'transparent',
      color: active ? 'white' : '#A597D2',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'Lato, sans-serif',
    }}
  >
    {children}
  </button>
);

const FilterField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="field-label">{label}</label>
    {children}
  </div>
);

const Dropdown: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul
    className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto list-none"
    style={{
      background: 'white',
      border: '1px solid var(--line)',
      borderRadius: 8,
      boxShadow: '0 8px 24px rgba(46, 26, 71, 0.12)',
      padding: 0, margin: 0, top: '100%',
    }}
  >
    {children}
  </ul>
);

const DropdownItem: React.FC<{
  active: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}> = ({ active, onMouseDown, children }) => (
  <li
    onMouseDown={onMouseDown}
    className="px-3 py-2 text-sm cursor-pointer"
    style={{
      background: active ? 'var(--plum-50)' : 'white',
      color: active ? 'var(--plum-700)' : 'var(--ink)',
      listStyle: 'none',
    }}
  >
    {children}
  </li>
);

export default DirectoryPage;
