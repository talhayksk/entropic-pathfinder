
import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import AppCard from './components/AppCard';
import UpdateCard from './components/UpdateCard';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'updates'
  const [apps, setApps] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState(null);

  const parseWingetOutput = (output) => {
    console.log('Raw Winget Output:', output);
    const lines = output.split('\n');

    const separatorIndex = lines.findIndex(line => line.trim().match(/^[- ]{3,}$/));

    let dataStartIndex = 0;
    if (separatorIndex !== -1) {
      dataStartIndex = separatorIndex + 1;
    } else {
      const firstLineIndex = lines.findIndex(l => l.trim().length > 0);
      dataStartIndex = firstLineIndex + 1;
    }

    const results = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const parts = line.trim().split(/\s{2,}/);

      if (parts.length >= 2) {
        results.push({
          Name: parts[0],
          Id: parts[1],
          Version: parts[2] || 'Unknown',
          Available: parts.length > 3 ? parts[2] : '', // For updates: Name, Id, Version, Available, Source
          Source: parts.length > 3 ? parts[parts.length - 1] : 'winget'
        });
      }
    }
    return results;
  };

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    console.log('Starting search for:', query);

    try {
      if (window.api) {
        const result = await window.api.search(query);
        console.log('Search result raw:', result);
        const parsed = parseWingetOutput(result);
        console.log('Parsed result:', parsed);
        setApps(parsed);
      } else {
        console.error('Winget API is missing!');
        setError('Winget API not found.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const checkUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      if (window.api) {
        const result = await window.api.checkUpdates();
        const parsed = parseWingetOutput(result);
        // Filter out items that don't look like updates (missing Available version)
        // Winget upgrade output: Name, Id, Version, Available, Source
        const validUpdates = parsed.filter(u => u.Available && u.Available !== u.Source);
        setUpdates(validUpdates);
      }
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'updates') {
      checkUpdates();
    }
  }, [activeTab]);

  const handleInstall = async (id) => {
    setInstalling(id);
    try {
      if (window.api) {
        await window.api.install(id);
        alert(`Successfully installed ${id} `);
      }
    } catch (err) {
      alert(`Failed to install: ${err} `);
    } finally {
      setInstalling(null);
    }
  };

  const handleUpdate = async (id) => {
    setUpdating(id);
    try {
      if (window.api) {
        await window.api.upgrade(id);
        alert(`Successfully updated ${id} `);
        checkUpdates(); // Refresh list
      }
    } catch (err) {
      alert(`Failed to update: ${err} `);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateAll = async () => {
    if (!confirm('Are you sure you want to update all apps? This may take a while.')) return;
    setLoading(true);
    try {
      if (window.api) {
        await window.api.upgradeAll();
        alert('All apps updated successfully!');
        checkUpdates();
      }
    } catch (err) {
      alert(`Failed to update all: ${err} `);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans selection:bg-blue-500/30 pt-12">
      <div className="titlebar-drag-region fixed top-0 left-0 w-full h-8 z-50" />
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
            Winget Manager
          </h1>
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'updates'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              Updates
            </button>
          </div>
        </header>

        {activeTab === 'search' ? (
          <>
            <SearchBar onSearch={handleSearch} />
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {apps.map((app) => (
                  <AppCard
                    key={app.Id}
                    app={app}
                    onInstall={handleInstall}
                    isInstalling={installing === app.Id}
                  />
                ))}
                {apps.length === 0 && !error && (
                  <div className="text-center text-gray-500 py-12">
                    Search for an app to get started
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Available Updates ({updates.length})</h2>
              {updates.length > 0 && (
                <button
                  onClick={handleUpdateAll}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-green-900/20"
                >
                  Update All
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {updates.map((app) => (
                  <UpdateCard
                    key={app.Id}
                    app={app}
                    onUpdate={handleUpdate}
                    isUpdating={updating === app.Id}
                  />
                ))}
                {updates.length === 0 && !error && (
                  <div className="text-center text-gray-500 py-12">
                    All your apps are up to date!
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl mt-8 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

