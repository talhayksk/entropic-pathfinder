
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
  const [uninstalling, setUninstalling] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState(null);
  const [installedIds, setInstalledIds] = useState(new Set());

  // Multi-select states
  const [selectedApps, setSelectedApps] = useState(new Set());
  const [selectedUpdates, setSelectedUpdates] = useState(new Set());
  const [bulkInstalling, setBulkInstalling] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentName: '' });

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
          Available: parts.length > 3 ? parts[3] : '', // For updates: Name, Id, Version, Available, Source
          Source: parts.length > 3 ? parts[parts.length - 1] : 'winget'
        });
      }
    }
    return results;
  };

  const checkInstalledStatus = async (searchResults) => {
    try {
      if (window.api) {
        const listOutput = await window.api.listInstalled();
        const installedApps = parseWingetOutput(listOutput);
        const idSet = new Set(installedApps.map(a => a.Id.toLowerCase()));
        setInstalledIds(idSet);
      }
    } catch (err) {
      console.error('Failed to check installed status:', err);
    }
  };

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    setSelectedApps(new Set()); // Clear selection on new search
    console.log('Starting search for:', query);

    try {
      if (window.api) {
        const result = await window.api.search(query);
        console.log('Search result raw:', result);
        const parsed = parseWingetOutput(result);
        console.log('Parsed result:', parsed);
        setApps(parsed);
        // Check which of these are already installed
        await checkInstalledStatus(parsed);
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
    setSelectedUpdates(new Set()); // Clear selection on refresh
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

  // Toggle selection for search results
  const toggleAppSelection = (id) => {
    setSelectedApps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle selection for updates
  const toggleUpdateSelection = (id) => {
    setSelectedUpdates(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select / Deselect all (search - only not-installed apps)
  const toggleSelectAllApps = () => {
    const notInstalledApps = apps.filter(a => !installedIds.has(a.Id.toLowerCase()));
    if (selectedApps.size === notInstalledApps.length && notInstalledApps.length > 0) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(notInstalledApps.map(a => a.Id)));
    }
  };

  // Select / Deselect all (updates)
  const toggleSelectAllUpdates = () => {
    if (selectedUpdates.size === updates.length && updates.length > 0) {
      setSelectedUpdates(new Set());
    } else {
      setSelectedUpdates(new Set(updates.map(u => u.Id)));
    }
  };

  const handleInstall = async (id) => {
    setInstalling(id);
    try {
      if (window.api) {
        await window.api.install(id);
        alert(`Successfully installed ${id}`);
        // Refresh installed status
        await checkInstalledStatus(apps);
      }
    } catch (err) {
      alert(`Failed to install: ${err}`);
    } finally {
      setInstalling(null);
    }
  };

  const handleUninstall = async (id) => {
    if (!confirm(`Are you sure you want to uninstall ${id}?`)) return;
    setUninstalling(id);
    try {
      if (window.api) {
        await window.api.uninstall(id);
        alert(`Successfully uninstalled ${id}`);
        // Refresh installed status
        await checkInstalledStatus(apps);
      }
    } catch (err) {
      alert(`Failed to uninstall: ${err}`);
    } finally {
      setUninstalling(null);
    }
  };

  // Bulk install selected apps
  const handleBulkInstall = async () => {
    const ids = Array.from(selectedApps);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length} uygulama kurulacak. Devam etmek istiyor musunuz?`)) return;

    setBulkInstalling(true);
    const failed = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const appName = apps.find(a => a.Id === id)?.Name || id;
      setBulkProgress({ current: i + 1, total: ids.length, currentName: appName });
      setInstalling(id);
      try {
        if (window.api) {
          await window.api.install(id);
        }
      } catch (err) {
        failed.push({ id, error: err.toString() });
      }
      setInstalling(null);
    }

    setBulkInstalling(false);
    setBulkProgress({ current: 0, total: 0, currentName: '' });
    setSelectedApps(new Set());
    await checkInstalledStatus(apps);

    if (failed.length > 0) {
      alert(`${ids.length - failed.length}/${ids.length} uygulama başarıyla kuruldu.\nBaşarısız: ${failed.map(f => f.id).join(', ')}`);
    } else {
      alert(`${ids.length} uygulama başarıyla kuruldu!`);
    }
  };

  const handleUpdate = async (id) => {
    setUpdating(id);
    try {
      if (window.api) {
        await window.api.upgrade(id);
        alert(`Successfully updated ${id}`);
        checkUpdates(); // Refresh list
      }
    } catch (err) {
      alert(`Failed to update: ${err}`);
    } finally {
      setUpdating(null);
    }
  };

  // Bulk update selected apps
  const handleBulkUpdate = async () => {
    const ids = Array.from(selectedUpdates);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length} uygulama güncellenecek. Devam etmek istiyor musunuz?`)) return;

    setBulkUpdating(true);
    const failed = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const appName = updates.find(u => u.Id === id)?.Name || id;
      setBulkProgress({ current: i + 1, total: ids.length, currentName: appName });
      setUpdating(id);
      try {
        if (window.api) {
          await window.api.upgrade(id);
        }
      } catch (err) {
        failed.push({ id, error: err.toString() });
      }
      setUpdating(null);
    }

    setBulkUpdating(false);
    setBulkProgress({ current: 0, total: 0, currentName: '' });
    setSelectedUpdates(new Set());
    checkUpdates();

    if (failed.length > 0) {
      alert(`${ids.length - failed.length}/${ids.length} uygulama başarıyla güncellendi.\nBaşarısız: ${failed.map(f => f.id).join(', ')}`);
    } else {
      alert(`${ids.length} uygulama başarıyla güncellendi!`);
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
      alert(`Failed to update all: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const isBulkProcessing = bulkInstalling || bulkUpdating;
  const notInstalledApps = apps.filter(a => !installedIds.has(a.Id.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans selection:bg-blue-500/30 pt-12">
      <div className="titlebar-drag-region fixed top-0 left-0 w-full h-8 z-50" />
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-5">
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

            {/* Bulk action bar for search */}
            {apps.length > 0 && !loading && (
              <div className="flex items-center justify-between bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl px-5 py-3 mb-4 mt-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAllApps}
                    disabled={isBulkProcessing || notInstalledApps.length === 0}
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedApps.size === notInstalledApps.length && notInstalledApps.length > 0
                        ? 'bg-blue-600 border-blue-600'
                        : selectedApps.size > 0
                          ? 'bg-blue-600/50 border-blue-500'
                          : 'border-gray-500 hover:border-gray-400'
                      }`}>
                      {selectedApps.size > 0 && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          {selectedApps.size === notInstalledApps.length && notInstalledApps.length > 0
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          }
                        </svg>
                      )}
                    </div>
                    Select All
                  </button>
                  {selectedApps.size > 0 && (
                    <span className="text-sm text-blue-400 font-medium">
                      {selectedApps.size} selected
                    </span>
                  )}
                </div>
                {selectedApps.size > 0 && (
                  <button
                    onClick={handleBulkInstall}
                    disabled={isBulkProcessing}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-900/20 text-sm"
                  >
                    {bulkInstalling
                      ? `Installing... (${bulkProgress.current}/${bulkProgress.total})`
                      : `Install Selected (${selectedApps.size})`
                    }
                  </button>
                )}
              </div>
            )}

            {/* Bulk progress bar */}
            {bulkInstalling && (
              <div className="mb-4">
                <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl px-5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">
                      Installing: <span className="text-white font-medium">{bulkProgress.currentName}</span>
                    </span>
                    <span className="text-sm text-blue-400">{bulkProgress.current}/{bulkProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

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
                    isInstalled={installedIds.has(app.Id.toLowerCase())}
                    isSelected={selectedApps.has(app.Id)}
                    onToggleSelect={() => toggleAppSelection(app.Id)}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                    isInstalling={installing === app.Id}
                    isUninstalling={uninstalling === app.Id}
                    isBulkProcessing={isBulkProcessing}
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
            {/* Bulk action bar for updates */}
            <div className="flex items-center justify-between bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl px-5 py-3 mb-6">
              <div className="flex items-center gap-3">
                {updates.length > 0 && (
                  <button
                    onClick={toggleSelectAllUpdates}
                    disabled={isBulkProcessing}
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedUpdates.size === updates.length && updates.length > 0
                        ? 'bg-blue-600 border-blue-600'
                        : selectedUpdates.size > 0
                          ? 'bg-blue-600/50 border-blue-500'
                          : 'border-gray-500 hover:border-gray-400'
                      }`}>
                      {selectedUpdates.size > 0 && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          {selectedUpdates.size === updates.length && updates.length > 0
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          }
                        </svg>
                      )}
                    </div>
                    Select All
                  </button>
                )}
                <h2 className="text-lg font-bold">Available Updates ({updates.length})</h2>
                {selectedUpdates.size > 0 && (
                  <span className="text-sm text-blue-400 font-medium">
                    {selectedUpdates.size} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedUpdates.size > 0 && (
                  <button
                    onClick={handleBulkUpdate}
                    disabled={isBulkProcessing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 text-sm"
                  >
                    {bulkUpdating
                      ? `Updating... (${bulkProgress.current}/${bulkProgress.total})`
                      : `Update Selected (${selectedUpdates.size})`
                    }
                  </button>
                )}
                {updates.length > 0 && (
                  <button
                    onClick={handleUpdateAll}
                    disabled={loading || isBulkProcessing}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg font-medium transition-colors shadow-lg shadow-green-900/20 text-sm"
                  >
                    Update All
                  </button>
                )}
              </div>
            </div>

            {/* Bulk progress bar */}
            {bulkUpdating && (
              <div className="mb-4">
                <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl px-5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">
                      Updating: <span className="text-white font-medium">{bulkProgress.currentName}</span>
                    </span>
                    <span className="text-sm text-blue-400">{bulkProgress.current}/{bulkProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

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
                    isSelected={selectedUpdates.has(app.Id)}
                    onToggleSelect={() => toggleUpdateSelection(app.Id)}
                    onUpdate={handleUpdate}
                    isUpdating={updating === app.Id}
                    isBulkProcessing={isBulkProcessing}
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
