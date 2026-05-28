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
}) {
  const [query, setQuery] = useState('');

  return (
    <div className={`search-bar ${className}`}>
      {/* Search icon */}
      <Search size={18} color="#8f97ad" style={{ flexShrink: 0 }} />

      {/* Text input */}
      <input
        type="search"
        className="search-bar__input"
        placeholder={placeholder}
        aria-label="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSearch?.(query)}
      />

      {/* Divider */}
      <span className="search-bar__divider" aria-hidden="true" />

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
