import React from 'react';

const UpdateCard = ({ app, onUpdate, isUpdating }) => {
    return (
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/60 transition-all group">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">{app.Name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{app.Id}</p>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs bg-red-900/50 text-red-200 rounded border border-red-800/50">
                            {app.Version}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="px-2 py-1 text-xs bg-green-900/50 text-green-200 rounded border border-green-800/50">
                            {app.Available}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => onUpdate(app.Id)}
                    disabled={isUpdating}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${isUpdating
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                        }`}
                >
                    {isUpdating ? 'Updating...' : 'Update'}
                </button>
            </div>
        </div>
    );
};

export default UpdateCard;
