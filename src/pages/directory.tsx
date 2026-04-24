import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserProfile, getUserRole, UserProfile, signOut } from '../lib/auth';
import ProfileCard from '../components/ProfileCard';

const SELECT_CLASS =
  'w-full px-3 py-2.5 border border-[#C8B6F0] rounded-md text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#673AB7] focus:border-[#673AB7]';

const INPUT_CLASS =
  'w-full px-4 py-2.5 border border-[#C8B6F0] rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#673AB7] focus:border-[#673AB7]';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const companies = useMemo(() => {
    const unique = Array.from(new Set(profiles.map(p => p.current_company).filter(Boolean)));
    return unique.sort();
  }, [profiles]);

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

  useEffect(() => {
    checkAuthAndLoadProfiles();
  }, []);

  const checkAuthAndLoadProfiles = async () => {
    const user = await getCurrentUser();
    if (!user) { navigate('/signup'); return; }
    const profile = await getUserProfile();
    setUserProfile(profile);
    const role = await getUserRole();
    setIsAdmin(role?.role === 'admin');
    await loadProfiles();
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      if (error) { console.error('Error loading profiles:', error); return; }
      setProfiles(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        profile.name.toLowerCase().includes(q) ||
        profile.current_company.toLowerCase().includes(q) ||
        (profile.sector && profile.sector.toLowerCase().includes(q));
      const matchesCompany = !filterCompany || profile.current_company === filterCompany;
      const matchesYear = !filterYear || profile.graduation_year.toString() === filterYear;
      const matchesCity = !filterCity || profile.current_city === filterCity;
      const matchesSector = !filterSector || profile.sector === filterSector;
      const matchesBio = !filterBio || (profile.bio && profile.bio.toLowerCase().includes(filterBio.toLowerCase()));
      return matchesSearch && matchesCompany && matchesYear && matchesCity && matchesSector && matchesBio;
    });
  }, [profiles, searchQuery, filterCompany, filterYear, filterCity, filterSector, filterBio]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCompany('');
    setFilterYear('');
    setFilterCity('');
    setFilterSector('');
    setFilterBio('');
  };

  const hasActiveFilters = searchQuery || filterCompany || filterYear || filterCity || filterSector || filterBio;

  const handleSignOut = async () => {
    await signOut();
    navigate('/signup');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4FF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C8B6F0] border-t-[#673AB7] mx-auto"></div>
          <p className="mt-4 text-[#8B6AD9] text-sm">Loading directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4FF]">
      <header className="sticky top-0 z-10 bg-[#2E1A47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">WiCS Alumni Directory</h1>
            <p className="text-[#C8B6F0] text-xs mt-0.5">{profiles.length} members</p>
          </div>
          <nav className="flex items-center gap-6">
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className="text-[#C8B6F0] text-sm font-medium">
                Admin
              </button>
            )}
            {userProfile && (
              <button onClick={() => navigate('/profile')} className="text-[#C8B6F0] text-sm">
                My Profile
              </button>
            )}
            <button onClick={handleSignOut} className="text-[#C8B6F0] text-sm">
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-[#C8B6F0] rounded-lg p-5 mb-6">
          <div className="space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, or sector..."
              className={INPUT_CLASS}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)} className={SELECT_CLASS}>
                <option value="">All Companies</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={SELECT_CLASS}>
                <option value="">All Years</option>
                {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
              </select>
              <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className={SELECT_CLASS}>
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)} className={SELECT_CLASS}>
                <option value="">All Sectors</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <input
              type="text"
              value={filterBio}
              onChange={(e) => setFilterBio(e.target.value)}
              placeholder="Filter by bio keyword..."
              className={INPUT_CLASS}
            />

            <div className="flex items-center justify-between pt-1">
              {hasActiveFilters ? (
                <button onClick={clearFilters} className="text-xs text-[#673AB7] font-medium">
                  Clear all filters
                </button>
              ) : <div />}
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#EDE7F6] text-[#673AB7]' : 'text-gray-300'}`}
                  title="Grid view"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#EDE7F6] text-[#673AB7]' : 'text-gray-300'}`}
                  title="List view"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#8B6AD9] font-medium uppercase tracking-wide mb-5">
          Showing {filteredProfiles.length} of {profiles.length} members
        </p>

        {filteredProfiles.length === 0 ? (
          <div className="bg-white border border-[#C8B6F0] rounded-lg p-12 text-center">
            <p className="text-gray-400 text-sm">No members found matching your criteria.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-[#673AB7]">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'space-y-4'
          }>
            {filteredProfiles.map(profile => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryPage;
