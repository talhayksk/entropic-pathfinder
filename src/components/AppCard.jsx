import React from 'react';

const AppCard = ({ app, isInstalled, isSelected, onToggleSelect, onInstall, onUninstall, isInstalling, isUninstalling, isBulkProcessing }) => {
    const isBusy = isInstalling || isUninstalling || isBulkProcessing;

    return (
        <div
            className={`bg-gray-800/40 backdrop-blur-sm border rounded-xl p-6 hover:bg-gray-800/60 transition-all group cursor-pointer ${isSelected ? 'border-blue-500/70 bg-blue-900/20' : 'border-gray-700/50'
                }`}
            onClick={() => {
                if (!isInstalled && !isBusy) onToggleSelect();
            }}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    {/* Checkbox - only for not-installed apps */}
                    {!isInstalled && (
                        <div
                            className={`mt-1 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${isSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-500 hover:border-gray-400'
                                }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isBusy) onToggleSelect();
                            }}
                        >
                            {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white">{app.Name}</h3>
                            {isInstalled && (
                                <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-medium">
                                    Installed
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{app.Id}</p>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs bg-gray-700 rounded text-gray-300">{app.Version}</span>
                            <span className="px-2 py-1 text-xs bg-gray-700 rounded text-gray-300">{app.Source}</span>
                        </div>
                    </div>
                </div>
                {isInstalled ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onUninstall(app.Id); }}
                        disabled={isBusy}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${isBusy
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'
                            }`}
                    >
                        {isUninstalling ? 'Uninstalling...' : 'Uninstall'}
                    </button>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); onInstall(app.Id); }}
                        disabled={isBusy}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${isBusy
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
                            }`}
                    >
                        {isInstalling ? 'Installing...' : 'Install'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default AppCard;
