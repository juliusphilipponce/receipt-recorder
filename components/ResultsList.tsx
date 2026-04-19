
import React from 'react';
import { ProcessResult, ProcessingStatus } from '../types';
import { formatCurrency } from '../utils/formatters';

const StatusBadge: React.FC<{ status: ProcessingStatus }> = ({ status }) => {
    const statusStyles: Record<ProcessingStatus, string> = {
        pending: 'bg-gray-600 text-gray-200',
        analyzing: 'bg-blue-600 text-blue-100 animate-pulse',
        needs_review: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
        saving: 'bg-indigo-600 text-indigo-100 animate-pulse',
        saved: 'bg-green-600 text-green-100',
        duplicate: 'bg-yellow-600 text-yellow-100',
        error: 'bg-red-600 text-red-100',
        not_configured: 'bg-sky-600 text-sky-100',
    };
    const statusText: Record<ProcessingStatus, string> = {
        pending: 'Pending',
        analyzing: 'Analyzing...',
        needs_review: 'Needs Review',
        saving: 'Saving...',
        saved: 'Saved',
        duplicate: 'Duplicate',
        error: 'Error',
        not_configured: 'Not Saved',
    };

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>
            {statusText[status]}
        </span>
    );
};

const ResultItem: React.FC<{ result: ProcessResult, index: number, onReview: (idx: number) => void }> = ({ result, index, onReview }) => {
    const { file, status, data, error, logs } = result;

    const progressValue = (() => {
        switch (status) {
            case 'pending': return 0;
            case 'analyzing': return 33;
            case 'needs_review': return 66;
            case 'saving': return 85;
            case 'saved':
            case 'duplicate':
            case 'error':
            case 'not_configured': return 100;
            default: return 0;
        }
    })();

    const isComplete = progressValue === 100;
    const progressColor = status === 'error' ? 'bg-red-500' : 
                         status === 'saved' ? 'bg-green-500' :
                         status === 'duplicate' ? 'bg-yellow-500' : 'bg-[#0ea5e9]';

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-700">
                <div 
                    className={`h-1.5 ${progressColor} transition-all duration-500 ease-out`} 
                    style={{ width: `${progressValue}%` }}
                ></div>
            </div>
            
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex-grow w-full">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-300 truncate w-4/6" title={file.name}>{file.name}</p>
                        <StatusBadge status={status} />
                    </div>
                    {data ? (
                        <div className="text-xs sm:text-sm">
                            <p className="font-bold text-[#0ea5e9] text-sm sm:text-base">{data.merchantName || 'Unknown Merchant'}</p>
                            <p className="text-gray-400 text-xs sm:text-sm">{data.date || 'Unknown Date'}</p>
                            <p className="font-mono font-semibold text-base sm:text-lg text-white mt-1">{formatCurrency(data.total || 0)}</p>
                        </div>
                    ) : (
                       status !== 'pending' && status !== 'analyzing' && <p className="text-xs sm:text-sm text-gray-400 italic">No details could be extracted.</p>
                    )}
                    
                    {error && <p className="text-xs text-red-400 mt-2"><strong>Error:</strong> {error}</p>}
                    {status === 'not_configured' && <p className="text-xs text-sky-400 mt-2">Supabase not configured. Receipt was analyzed but not saved.</p>}
                    
                    {status === 'needs_review' && (
                        <div className="mt-3 flex justify-end">
                            <button 
                                onClick={() => onReview(index)}
                                className="bg-[#0ea5e9] hover:bg-sky-500 text-white font-bold py-1 px-4 rounded text-sm transition-colors shadow-sm"
                            >
                                Review & Save
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ResultsList: React.FC<{ results: ProcessResult[], onReviewItem: (index: number) => void }> = ({ results, onReviewItem }) => {
    return (
        <div className="w-full max-w-4xl space-y-3 sm:space-y-4 animate-fade-in">
             <h2 className="text-xl sm:text-2xl font-bold text-center mb-3 sm:mb-4">Review Queue</h2>
            {results.map((result, index) => (
                <ResultItem key={`${result.file.name}-${index}`} result={result} index={index} onReview={onReviewItem} />
            ))}
        </div>
    );
};

export default ResultsList;