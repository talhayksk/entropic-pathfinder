import React from 'react';

const UpdateCard = ({ app, isSelected, onToggleSelect, onUpdate, isUpdating, isBulkProcessing }) => {
    const isBusy = isUpdating || isBulkProcessing;

    return (
        <div
            className={`bg-gray-800/40 backdrop-blur-sm border rounded-xl p-6 hover:bg-gray-800/60 transition-all group cursor-pointer ${isSelected ? 'border-blue-500/70 bg-blue-900/20' : 'border-gray-700/50'
                }`}
            onClick={() => { if (!isBusy) onToggleSelect(); }}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    {/* Checkbox */}
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
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onUpdate(app.Id); }}
                    disabled={isBusy}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${isBusy
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
