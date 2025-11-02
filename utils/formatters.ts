export const formatCurrency = (amount: number, currency = 'PHP') => {
    // Fallback for non-numeric values
    if (typeof amount !== 'number') {
        amount = 0;
    }
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(amount);
};
