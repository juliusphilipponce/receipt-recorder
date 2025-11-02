import React, { useState, useEffect, useMemo } from 'react';
import { getReceipts } from '../services/receiptService';
import { ReceiptData } from '../types';
import Spinner from './Spinner';
import ReceiptModal from './ReceiptModal';
import { formatCurrency } from '../utils/formatters';
import SearchToggle from './SearchToggle';
import MonthDropdown from './MonthDropdown';

// Define types for sorting functionality
type SortKey = 'date' | 'merchantName' | 'total';
type SortDirection = 'asc' | 'desc';

// Helper to format 'YYYY-MM' into 'Month YYYY'
const formatMonthYear = (monthYear: string) => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};


const ReceiptsViewer: React.FC = () => {
    const [allReceipts, setAllReceipts] = useState<ReceiptData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
    
    // Filtering state
    const [selectedMonthYear, setSelectedMonthYear] = useState('');
    const [searchText, setSearchText] = useState('');

    // Sorting state
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default to newest first

    const fetchReceipts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getReceipts();
            setAllReceipts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, []);

    const { groupedReceipts, availableMonths } = useMemo(() => {
        const grouped = allReceipts.reduce((acc, receipt) => {
            const monthYear = receipt.date.substring(0, 7); // 'YYYY-MM'
            if (!acc[monthYear]) {
                acc[monthYear] = [];
            }
            acc[monthYear].push(receipt);
            return acc;
        }, {} as Record<string, ReceiptData[]>);

        const months = Object.keys(grouped).sort().reverse();
        return { groupedReceipts: grouped, availableMonths: months };
    }, [allReceipts]);

    // Set default month after data is loaded and grouped
    useEffect(() => {
        if (availableMonths.length > 0 && !selectedMonthYear) {
            const currentMonthYear = new Date().toISOString().substring(0, 7);
            const defaultMonth = availableMonths.includes(currentMonthYear) ? currentMonthYear : availableMonths[0];
            setSelectedMonthYear(defaultMonth);
        }
    }, [availableMonths, selectedMonthYear]);

    const sortedAndFilteredReceipts = useMemo(() => {
        if (!selectedMonthYear) return [];

        const receiptsForMonth = groupedReceipts[selectedMonthYear] || [];
        
        // 1. Filter by search text
        const filtered = !searchText
            ? receiptsForMonth
            : receiptsForMonth.filter(receipt =>
                receipt.merchantName.toLowerCase().includes(searchText.toLowerCase())
              );
        
        // 2. Sort the filtered results
        return [...filtered].sort((a, b) => {
            if (sortKey === 'merchantName') {
                const comparison = a.merchantName.localeCompare(b.merchantName, undefined, { sensitivity: 'base' });
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            const valA = a[sortKey];
            const valB = b[sortKey];

            let comparison = 0;
            if (valA > valB) {
                comparison = 1;
            } else if (valA < valB) {
                comparison = -1;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

    }, [selectedMonthYear, searchText, groupedReceipts, sortKey, sortDirection]);
    
    const monthlyTotal = useMemo(() => {
        return sortedAndFilteredReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
    }, [sortedAndFilteredReceipts]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            // If same key, toggle direction
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // If new key, set it and default direction
            setSortKey(key);
            // Sensible defaults: newest/highest first for date/total, A-Z for merchant
            setSortDirection(key === 'merchantName' ? 'asc' : 'desc');
        }
    };


    if (isLoading) {
        return <Spinner text="Loading receipts..." />;
    }

    if (error) {
        return <div className="text-center text-red-400 bg-red-900/50 p-4 sm:p-6 rounded-lg">
            <h3 className="text-lg sm:text-xl font-bold mb-2">Failed to load receipts</h3>
            <p className="text-sm sm:text-base">{error}</p>
        </div>;
    }

    if (allReceipts.length === 0) {
        return (
             <div className="text-center text-gray-400 bg-gray-800 p-8 sm:p-12 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl sm:text-2xl font-bold mt-3 sm:mt-4">No receipts found</h3>
                <p className="mt-2 text-sm sm:text-base">Scan your first receipt to see it here.</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl animate-fade-in">
            {/* Filter Controls */}
            <div className="bg-gray-800 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border border-gray-700">
                {/* Mobile Layout */}
                <div className="sm:hidden">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Month</label>
                    {/* Month dropdown + Search icon on same row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                            <MonthDropdown
                                availableMonths={availableMonths}
                                selectedMonth={selectedMonthYear}
                                onChange={setSelectedMonthYear}
                            />
                        </div>
                        <SearchToggle
                            value={searchText}
                            onChange={setSearchText}
                            placeholder="e.g., Coffee Shop"
                        />
                    </div>
                </div>

                {/* Desktop Layout - Side by side */}
                <div className="hidden sm:flex sm:gap-4">
                    <div className="flex-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Month</label>
                        <MonthDropdown
                            availableMonths={availableMonths}
                            selectedMonth={selectedMonthYear}
                            onChange={setSelectedMonthYear}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">Search Merchant</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="e.g., Coffee Shop"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 pr-8 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-500 text-sm sm:text-base"
                            />
                            {/* Clear button inside input */}
                            {searchText && (
                                <button
                                    onClick={() => setSearchText('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    title="Clear search"
                                    aria-label="Clear search"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Receipts Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-xs sm:text-sm text-left text-gray-300 table-fixed sm:table-auto">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3">
                                <button
                                    onClick={() => handleSort('date')}
                                    className={`flex items-center gap-1 sm:gap-2 transition-colors text-xs ${sortKey === 'date' ? 'text-teal-300' : 'hover:text-white'}`}
                                    aria-label={`Sort by Date in ${sortKey === 'date' && sortDirection === 'asc' ? 'descending' : 'ascending'} order`}
                                >
                                    Date
                                    {sortKey === 'date' && <span className="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                                </button>
                            </th>
                            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3">
                                <button
                                    onClick={() => handleSort('merchantName')}
                                    className={`flex items-center gap-1 sm:gap-2 transition-colors text-xs ${sortKey === 'merchantName' ? 'text-teal-300' : 'hover:text-white'}`}
                                    aria-label={`Sort by Merchant in ${sortKey === 'merchantName' && sortDirection === 'asc' ? 'descending' : 'ascending'} order`}
                                >
                                    Merchant
                                    {sortKey === 'merchantName' && <span className="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                                </button>
                            </th>
                            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-right">
                                <button
                                    onClick={() => handleSort('total')}
                                    className={`flex items-center gap-1 sm:gap-2 ml-auto transition-colors text-xs ${sortKey === 'total' ? 'text-teal-300' : 'hover:text-white'}`}
                                    aria-label={`Sort by Total in ${sortKey === 'total' && sortDirection === 'asc' ? 'descending' : 'ascending'} order`}
                                >
                                    Total
                                    {sortKey === 'total' && <span className="text-xs">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredReceipts.length > 0 ? (
                            sortedAndFilteredReceipts.map(receipt => (
                                <tr
                                    key={receipt.id}
                                    onClick={() => setSelectedReceipt(receipt)}
                                    className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer transition-colors"
                                    aria-label={`View details for ${receipt.merchantName} on ${receipt.date}`}
                                >
                                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm whitespace-nowrap">{receipt.date}</td>
                                    <th scope="row" className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-white text-xs sm:text-sm max-w-[120px] sm:max-w-none truncate">
                                        {receipt.merchantName}
                                    </th>
                                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-right font-mono text-xs sm:text-sm whitespace-nowrap">{formatCurrency(receipt.total)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="text-center py-6 sm:py-8 px-3 sm:px-4 text-gray-400 text-xs sm:text-sm">
                                   {searchText
                                     ? `No receipts match your search for "${searchText}" in ${formatMonthYear(selectedMonthYear)}.`
                                     : `No receipts found for ${formatMonthYear(selectedMonthYear)}.`
                                   }
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {sortedAndFilteredReceipts.length > 0 && (
                        <tfoot className="bg-gray-700/50 font-bold">
                            <tr>
                                <td colSpan={2} className="px-3 py-2 sm:px-6 sm:py-3 text-right text-sm sm:text-lg text-gray-300 uppercase tracking-wider">
                                    Monthly Total
                                </td>
                                <td className="px-3 py-2 sm:px-6 sm:py-3 text-right font-mono text-sm sm:text-lg text-teal-300">
                                    {formatCurrency(monthlyTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {selectedReceipt && (
                <ReceiptModal
                    receipt={selectedReceipt}
                    onClose={() => setSelectedReceipt(null)}
                    onUpdate={fetchReceipts}
                />
            )}
        </div>
    );
};

export default ReceiptsViewer;