import React, { useState, useRef, useEffect, useMemo } from 'react';

interface MonthDropdownProps {
    availableMonths: string[]; // Array of 'YYYY-MM' strings
    selectedMonth: string;
    onChange: (month: string) => void;
}

// Helper to format 'YYYY-MM' into 'Month YYYY'
const formatMonthYear = (monthYear: string) => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Helper to get month name only
const getMonthName = (monthYear: string) => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long' });
};

const MonthDropdown: React.FC<MonthDropdownProps> = ({ 
    availableMonths, 
    selectedMonth, 
    onChange 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Group months by year
    const groupedMonths = useMemo(() => {
        const groups: Record<string, string[]> = {};
        
        availableMonths.forEach(month => {
            const year = month.split('-')[0];
            if (!groups[year]) {
                groups[year] = [];
            }
            groups[year].push(month);
        });

        // Sort years in descending order (newest first)
        return Object.keys(groups)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .map(year => ({
                year,
                months: groups[year].sort().reverse() // Newest month first within year
            }));
    }, [availableMonths]);

    // Filter months based on search query
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return groupedMonths;

        const query = searchQuery.toLowerCase();
        return groupedMonths
            .map(group => ({
                ...group,
                months: group.months.filter(month => 
                    formatMonthYear(month).toLowerCase().includes(query) ||
                    getMonthName(month).toLowerCase().includes(query) ||
                    group.year.includes(query)
                )
            }))
            .filter(group => group.months.length > 0);
    }, [groupedMonths, searchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Auto-focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (month: string) => {
        onChange(month);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchQuery('');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Dropdown Button */}
            <button
                type="button"
                onClick={handleToggle}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base flex items-center justify-between hover:bg-gray-600 transition-colors"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="truncate">{formatMonthYear(selectedMonth)}</span>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-96 overflow-hidden animate-fade-in-fast">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800">
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search month or year..."
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 pl-8 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-500 text-sm"
                            />
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.35-4.35"></path>
                            </svg>
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="overflow-y-auto max-h-80" role="listbox">
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map(group => (
                                <div key={group.year}>
                                    {/* Year Header */}
                                    <div className="px-3 py-2 bg-gray-700/50 text-gray-400 text-xs font-semibold uppercase tracking-wider sticky top-0">
                                        {group.year}
                                    </div>
                                    {/* Months in Year */}
                                    {group.months.map(month => (
                                        <button
                                            key={month}
                                            type="button"
                                            onClick={() => handleSelect(month)}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                                                month === selectedMonth 
                                                    ? 'bg-teal-500/20 text-teal-300 font-medium' 
                                                    : 'text-gray-300'
                                            }`}
                                            role="option"
                                            aria-selected={month === selectedMonth}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{getMonthName(month)}</span>
                                                {month === selectedMonth && (
                                                    <svg 
                                                        xmlns="http://www.w3.org/2000/svg" 
                                                        className="h-4 w-4 text-teal-400"
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        strokeWidth="2" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                No months found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthDropdown;

