import React from 'react';

function SearchBar({ searchQuery, setSearchQuery, onSearch }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Введите артикул запчасти (например: 01218N3, OC90, FILTER)"
        autoComplete="off"
        autoFocus
      />
      <button className="search-button" onClick={() => onSearch()}>
        <i className="fas fa-search"></i>
      </button>
    </div>
  );
}

export default SearchBar;