import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getCurrentUser, getUserProfile, getUserRole, UserProfile, signOut } from '../lib/auth';
import ProfileCard from '../components/ProfileCard';
import { LOCATIONS } from '../lib/locations';

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

  // Get unique values for filter dropdowns
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
    return profiles.filter(profile => {
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
                <button
                  onClick={() => navigate('/profile')}
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  My Profile
                </button>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

