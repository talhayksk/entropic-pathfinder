import React from 'react';

const AppCard = ({ app, onInstall, isInstalling }) => {
    return (
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/60 transition-all group">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">{app.Name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{app.Id}</p>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs bg-gray-700 rounded text-gray-300">{app.Version}</span>
                        <span className="px-2 py-1 text-xs bg-gray-700 rounded text-gray-300">{app.Source}</span>
                    </div>
                </div>
                <button
                    onClick={() => onInstall(app.Id)}
                    disabled={isInstalling}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${isInstalling
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
                        }`}
                >
                    {isInstalling ? 'Installing...' : 'Install'}
                </button>
            </div>
        </div>
    );
};

export default AppCard;
