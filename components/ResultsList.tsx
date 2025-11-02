
import React from 'react';
import { ProcessResult, ProcessingStatus } from '../types';
import { formatCurrency } from '../utils/formatters';

const StatusBadge: React.FC<{ status: ProcessingStatus }> = ({ status }) => {
    const statusStyles: Record<ProcessingStatus, string> = {
        pending: 'bg-gray-600 text-gray-200',
        analyzing: 'bg-blue-600 text-blue-100 animate-pulse',
        saving: 'bg-indigo-600 text-indigo-100 animate-pulse',
        saved: 'bg-green-600 text-green-100',
        duplicate: 'bg-yellow-600 text-yellow-100',
        error: 'bg-red-600 text-red-100',
        not_configured: 'bg-sky-600 text-sky-100',
    };
    const statusText: Record<ProcessingStatus, string> = {
        pending: 'Pending',
        analyzing: 'Analyzing...',
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


const ResultItem: React.FC<{ result: ProcessResult }> = ({ result }) => {
    const { file, status, data, error } = result;

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-grow w-full">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-300 truncate w-4/6" title={file.name}>{file.name}</p>
                    <StatusBadge status={status} />
                </div>
                {data ? (
                    <div className="text-sm">
                        <p className="font-bold text-teal-300">{data.merchantName || 'Unknown Merchant'}</p>
                        <p className="text-gray-400">{data.date || 'Unknown Date'}</p>
                        <p className="font-mono font-semibold text-lg text-white mt-1">{formatCurrency(data.total || 0)}</p>
                    </div>
                ) : (
                   status !== 'pending' && status !== 'analyzing' && <p className="text-sm text-gray-400 italic">No details could be extracted.</p>
                )}
                {error && <p className="text-xs text-red-400 mt-2"><strong>Error:</strong> {error}</p>}
                {status === 'not_configured' && <p className="text-xs text-sky-400 mt-2">Supabase not configured. Receipt was analyzed but not saved.</p>}
            </div>
        </div>
    );
};


const ResultsList: React.FC<{ results: ProcessResult[] }> = ({ results }) => {
    return (
        <div className="w-full max-w-4xl space-y-4 animate-fade-in">
             <h2 className="text-2xl font-bold text-center mb-4">Processing Results</h2>
            {results.map((result, index) => (
                <ResultItem key={`${result.file.name}-${index}`} result={result} />
            ))}
        </div>
    );
};

export default ResultsList;