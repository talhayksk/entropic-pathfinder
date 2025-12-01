import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-8">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for apps (e.g. Chrome, Spotify)..."
                    className="w-full px-6 py-4 text-lg bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 shadow-xl transition-all"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                >
                    Search
                </button>
            </div>
        </form>
    );
};

export default SearchBar;
