import React, { useState, useRef, useEffect } from 'react';

interface SearchToggleProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const SearchToggle: React.FC<SearchToggleProps> = ({
    value,
    onChange,
    placeholder = "Search merchant..."
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus when expanded
    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    // Keep expanded if there's search text
    useEffect(() => {
        if (value && !isExpanded) {
            setIsExpanded(true);
        }
    }, [value]);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
        if (isExpanded && value) {
            onChange(''); // Clear search when collapsing
        }
    };

    const handleClear = () => {
        onChange('');
        inputRef.current?.focus();
    };

    return (
        <>
            {/* Search Icon Button */}
            <div className="relative flex-shrink-0">
                <button
                    onClick={handleToggle}
                    className={`p-2 rounded-md transition-all duration-300 ${
                        isExpanded
                            ? 'bg-teal-500/20 text-teal-400'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                    }`}
                    title={isExpanded ? "Close search" : "Search merchant"}
                    aria-label={isExpanded ? "Close search" : "Search merchant"}
                >
                    {isExpanded ? (
                        // Close Icon (X)
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    ) : (
                        // Search Icon
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
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
                    )}
                </button>

                {/* Active filter indicator when collapsed */}
                {!isExpanded && value && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-teal-400 rounded-full"></span>
                )}
            </div>

            {/* Search Input - Full width on mobile when expanded, inline on desktop */}
            {isExpanded && (
                <div className="w-full sm:w-auto sm:flex-1 animate-fade-in-fast">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 pr-8 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-500 text-sm sm:text-base"
                        />
                        {/* Clear button inside input */}
                        {value && (
                            <button
                                onClick={handleClear}
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
            )}
        </>
    );
};

export default SearchToggle;

