import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserProfile, getUserRole, UserProfile, signOut } from '../lib/auth';
import ProfileCard from '../components/ProfileCard';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Get unique values for filter dropdowns
  const companies = useMemo(() => {
    const unique = Array.from(new Set(profiles.map(p => p.current_company).filter(Boolean)));
    return unique.sort();
  }, [profiles]);
  const [directoryView, setDirectoryView] = useState<'all' | 'saved'>('all');

  const cities = useMemo(() => {
    const unique = Array.from(new Set(profiles.map(p => p.current_city).filter(Boolean)));
    return unique.sort();
  }, [profiles]);

  const years = useMemo(() => {
    const unique = Array.from(new Set(profiles.map(p => p.graduation_year))).sort((a, b) => b - a);
    return unique;
  }, [profiles]);

  const sectors = useMemo(() => {
    const unique = Array.from(new Set(profiles.map(p => p.sector).filter(Boolean)));
    return unique.sort();
  }, [profiles]);


  const allInterests = useMemo(() => {
    const profileTags = Array.from(new Set(profiles.flatMap(p => p.tags ?? [])));
    return Array.from(new Set([...PRESET_TAGS, ...profileTags])).sort();
  }, [profiles]);

  const interestSuggestions = useMemo(() => {
    return allInterests.filter(t =>
      t.toLowerCase().includes(interestInput.toLowerCase()) && !filterInterests.includes(t)
    );
  }, [allInterests, interestInput, filterInterests]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (interestContainerRef.current && !interestContainerRef.current.contains(e.target as Node)) {
        setInterestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    checkAuthAndLoadProfiles();
  }, []);

  const checkAuthAndLoadProfiles = async () => {
    const user = await getCurrentUser();
    if (!user) {
      navigate('/signup');
      return;
    }

    const profile = await getUserProfile();
    setUserProfile(profile);

    // Check if user is admin
    const role = await getUserRole();
    setIsAdmin(role?.role === 'admin');

    // Load all profiles
    await loadProfiles();
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading profiles:', error);
        return;
      }

      setProfiles(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = useMemo(() => {
    const savedIds = directoryView === 'saved' ? new Set(getFavorites()) : null;
    return profiles.filter(profile => {
      if (savedIds && !savedIds.has(profile.id)) return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        profile.name.toLowerCase().includes(q) ||
        profile.current_company.toLowerCase().includes(q) ||
        (profile.sector && profile.sector.toLowerCase().includes(q));

      const matchesCompany = !filterCompany || profile.current_company === filterCompany;
      const matchesYear = !filterYear || profile.graduation_year.toString() === filterYear;
      const matchesCity = !filterCity || profile.current_city.toLowerCase().includes(filterCity.toLowerCase());
      const matchesSector = !filterSector || profile.sector === filterSector;
      const matchesBio = !filterBio || (profile.bio && profile.bio.toLowerCase().includes(filterBio.toLowerCase()));
      const matchesInterest = filterInterests.length === 0 || filterInterests.some(tag => (profile.tags ?? []).includes(tag));

      return matchesSearch && matchesCompany && matchesYear && matchesCity && matchesSector && matchesBio && matchesInterest;
    });
  }, [profiles, directoryView, searchQuery, filterCompany, filterYear, filterCity, filterSector, filterBio, filterInterests]);

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

  const hasActiveFilters = searchQuery || filterCompany || filterYear || filterCity || filterSector || filterBio || filterInterests.length > 0;

  const handleSignOut = async () => {
    await signOut();
    navigate('/signup');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WiCS Alumni Directory</h1>
              <p className="text-sm text-gray-600 mt-1">
                Connect with {profiles.length} members
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Admin Panel
                </button>
              )}

              {userProfile && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-sm text-gray-700 hover:text-gray-900"
                  >
                    My Profile
                  </button>

                  <button
                    className={`px-3 py-1 rounded text-sm ${directoryView === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => setDirectoryView('all')}
                  >
                    All Profiles
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${directoryView === 'saved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => setDirectoryView('saved')}
                  >
                    Saved Profiles
                  </button>
                </div>
              )}

              <button
                onClick={handleSignOut}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, company, or sector..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div>
                <label htmlFor="filter-company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <select
                  id="filter-company"
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Companies</option>
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-year" className="block text-sm font-medium text-gray-700 mb-2">
                  Graduation Year
                </label>
                <select
                  id="filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <select
                  id="filter-city"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Cities</option>
                  {[...LOCATIONS].sort().map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-sector" className="block text-sm font-medium text-gray-700 mb-2">
                  Sector
                </label>
                <select
                  id="filter-sector"
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Sectors</option>
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-interest" className="block text-sm font-medium text-gray-700 mb-2">
                  Area of Interest
                </label>
                {filterInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {filterInterests.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {tag}
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setFilterInterests(prev => prev.filter(t => t !== tag)); }}
                          className="hover:text-blue-900 leading-none"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div ref={interestContainerRef} className="relative">
                  <input
                    type="text"
                    id="filter-interest"
                    value={interestInput}
                    onChange={(e) => {
                      setInterestInput(e.target.value);
                      setInterestOpen(true);
                      setInterestActiveIndex(-1);
                    }}
                    onFocus={() => setInterestOpen(true)}
                    onKeyDown={(e) => {
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
                        setInterestInput('');
                        setInterestActiveIndex(-1);
                      } else if (e.key === 'Escape') {
                        setInterestOpen(false);
                      } else if (e.key === 'Backspace' && interestInput === '' && filterInterests.length > 0) {
                        setFilterInterests(prev => prev.slice(0, -1));
                      }
                    }}
                    placeholder="Type to filter interests..."
                    autoComplete="off"
                    className={`w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${interestOpen && interestSuggestions.length > 0 ? 'rounded-t-md rounded-b-none' : 'rounded-md'}`}
                  />
                  {interestOpen && interestSuggestions.length > 0 && (
                    <ul className="absolute z-50 rounded-b-md max-h-[360px] overflow-y-scroll list-none w-full" style={{ backgroundColor: 'white', borderLeft: '1px solid #d1d5db', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', top: '100%', bottom: 'auto', padding: 0, margin: 0 }}>
                      {interestSuggestions.map((tag, i) => (
                        <li
                          key={tag}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFilterInterests(prev => [...prev, tag]);
                            setInterestInput('');
                            setInterestActiveIndex(-1);
                          }}
                          className={`px-4 py-2 cursor-pointer text-sm ${
                            i === interestActiveIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                          style={{ borderBottom: i < interestSuggestions.length - 1 ? '1px solid #e5e7eb' : 'none', listStyle: 'none' }}
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>

            {/* Bio Keyword Filter */}
            <div>
              <label htmlFor="filter-bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio Keyword
              </label>
              <input
                type="text"
                id="filter-bio"
                value={filterBio}
                onChange={(e) => setFilterBio(e.target.value)}
                placeholder="Search by bio keyword or phrase..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Clear Filters and View Toggle */}
            <div className="flex items-center justify-between">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              )}
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid view"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="List view"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Showing {filteredProfiles.length} of {profiles.length} members
          </p>

          {filteredProfiles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500">No members found matching your criteria.</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Clear filters to see all members
                </button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {filteredProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectoryPage;

