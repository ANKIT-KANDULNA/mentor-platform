import React, { useState, useEffect, useCallback } from 'react';
import { getMentors } from '../api/mentor.api';
import MentorCard from '../components/MentorCard';
import { Search, Loader2, SlidersHorizontal, X } from 'lucide-react';

const BRANCHES = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Business Administration', 'Data Science', 'Civil Engineering'];
const TAGS = ['React', 'Node.js', 'Python', 'Machine Learning', 'System Design', 'Career Prep', 'DSA', 'Java', 'DevOps', 'Product Management'];
const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function MentorList() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sort, setSort] = useState('rating');
  const [showFilters, setShowFilters] = useState(true);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search) filters.search = search;
      if (branch) filters.branch = branch;
      if (selectedTags.length) filters.tag = selectedTags[0];
      const data = await getMentors(filters);
      let result = data.data || [];
      if (sort === 'price_asc') result = [...result].sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
      if (sort === 'price_desc') result = [...result].sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
      setMentors(result);
    } catch (err) {
      console.error('Failed to fetch mentors:', err.message);
    } finally {
      setLoading(false);
    }
  }, [search, branch, selectedTags, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchMentors, 300);
    return () => clearTimeout(timer);
  }, [fetchMentors]);

  const toggleTag = (tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const clearFilters = () => { setBranch(''); setSelectedTags([]); setSearch(''); };
  const hasFilters = branch || selectedTags.length > 0 || search;

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto' }} className="animate-fade">
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0 0 6px' }}>Find Your Mentor</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Connect with {mentors.length > 0 ? `${mentors.length}+` : 'experienced'} mentors from top universities and industries</p>
      </div>

      {/* Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input-field" style={{ width: '100%', paddingLeft: '44px' }}
            placeholder="Search by name, expertise, or headline..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px 14px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sort:</span>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.82rem', cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-sans)' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>{o.label}</option>)}
          </select>
        </div>
        <button onClick={() => setShowFilters(f => !f)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: showFilters ? 'var(--color-primary-glow)' : 'var(--bg-surface)',
          border: `1px solid ${showFilters ? 'var(--color-primary)' : 'var(--border-color)'}`,
          borderRadius: '10px', padding: '8px 14px', cursor: 'pointer',
          color: showFilters ? 'var(--color-primary)' : 'var(--text-muted)', fontSize: '0.82rem',
          fontWeight: 600, transition: 'all 0.2s',
        }}>
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showFilters ? '260px 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
        {/* Filter Sidebar */}
        {showFilters && (
          <div className="glass-panel animate-slide stagger-1" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'var(--font-display)' }}>Filters</h3>
              {hasFilters && <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Clear All</button>}
            </div>

            {/* Branch Filter */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Branch</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button onClick={() => setBranch('')} style={{
                  padding: '7px 12px', borderRadius: '8px', border: `1px solid ${!branch ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  background: !branch ? 'var(--color-primary-glow)' : 'transparent',
                  color: !branch ? 'var(--color-primary)' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: !branch ? 600 : 400, textAlign: 'left', transition: 'all 0.15s',
                }}>All Branches</button>
                {BRANCHES.map(b => (
                  <button key={b} onClick={() => setBranch(branch === b ? '' : b)} style={{
                    padding: '7px 12px', borderRadius: '8px', border: `1px solid ${branch === b ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: branch === b ? 'var(--color-primary-glow)' : 'transparent',
                    color: branch === b ? 'var(--color-primary)' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: branch === b ? 600 : 400, textAlign: 'left', transition: 'all 0.15s',
                  }}>{b}</button>
                ))}
              </div>
            </div>

            {/* Expertise Tags */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expertise</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{
                    padding: '4px 12px', borderRadius: '999px', border: `1px solid ${selectedTags.includes(tag) ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: selectedTags.includes(tag) ? 'var(--color-primary-glow)' : 'transparent',
                    color: selectedTags.includes(tag) ? 'var(--color-primary)' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: selectedTags.includes(tag) ? 600 : 400, transition: 'all 0.15s',
                  }}>{tag}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px' }}>
              <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Finding your perfect mentor...</p>
            </div>
          ) : mentors.length === 0 ? (
            <div className="glass-panel" style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '8px' }}>No mentors found</h3>
              <p style={{ margin: 0 }}>Try adjusting your filters or search terms.</p>
              {hasFilters && <button onClick={clearFilters} className="btn-primary" style={{ marginTop: '20px', borderRadius: 'var(--radius-sm)' }}>Clear Filters</button>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
              {mentors.map((mentor, idx) => (
                <div key={mentor.id} className="animate-slide" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <MentorCard mentor={mentor} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
