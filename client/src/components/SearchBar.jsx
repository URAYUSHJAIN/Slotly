/**
 * SearchBar — design.md §15
 * Pill-shaped | 60px height | Floating shadow
 * Layout: input | divider | filter dropdown | CTA icon button
 */
import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { IconButton } from './Button.jsx';

export function SearchBar({
  placeholder = 'Search services, doctors, specialties…',
  filterLabel = 'All services',
  onSearch,
  className = '',
  suggestions = [],
}) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = query.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className={`search-bar ${className}`} style={{ position: 'relative' }}>
      {/* Search icon */}
      <Search size={18} color="#8f97ad" style={{ flexShrink: 0 }} />

      {/* Text input */}
      <input
        type="search"
        className="search-bar__input"
        placeholder={placeholder}
        aria-label="Search"
        value={query}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
        }}
        onKeyDown={e => e.key === 'Enter' && onSearch?.(query)}
      />

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 8,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecf5',
          overflow: 'hidden',
          zIndex: 100,
          textAlign: 'left'
        }}>
          {filteredSuggestions.map((suggestion, i) => (
            <div
              key={suggestion}
              style={{
                padding: '12px 20px',
                fontSize: 14,
                color: '#111522',
                cursor: 'pointer',
                borderBottom: i === filteredSuggestions.length - 1 ? 'none' : '1px solid #f0f2f7',
                background: '#fff',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.background = '#f7f9fc'}
              onMouseLeave={(e) => e.target.style.background = '#fff'}
              onClick={() => {
                setQuery(suggestion);
                setShowSuggestions(false);
                onSearch?.(suggestion);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <button className="search-bar__filter" aria-label="Filter results">
        <SlidersHorizontal size={15} />
        {filterLabel}
      </button>

      {/* CTA icon button */}
      <IconButton
        variant="primary"
        label="Search"
        onClick={() => onSearch?.(query)}
      >
        <Search size={18} />
      </IconButton>
    </div>
  );
}
