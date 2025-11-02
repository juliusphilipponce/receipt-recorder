import { supabase } from './supabaseClient';
import { ReceiptData } from '../types';

/**
 * Creates a consistent, unique hash for a receipt based on its core data.
 * This is used to prevent duplicate entries in the database.
 * The item list is sorted to ensure the hash is the same regardless of item order.
 * @param data - The receipt data extracted by Gemini.
 * @returns A string hash.
 */
const createReceiptHash = (data: ReceiptData): string => {
    try {
        const itemsString = data.items
            .map(i => `${i.name?.trim() || ''}${i.price || 0}`)
            .sort()
            .join('');
        const coreString = `${data.merchantName?.trim() || ''}|${data.date?.trim() || ''}|${data.total || 0}|${itemsString}`;
        // In a real app, you might use a more robust hashing algorithm like SHA-256
        // but for this purpose, the string itself is a good enough unique identifier.
        return coreString;
    } catch (e) {
        // Fallback for any unexpected errors during hashing
        return `${data.merchantName}-${data.date}-${data.total}-${Date.now()}`;
    }
};

interface SaveResult {
  isDuplicate: boolean;
  error: any;
  notConfigured?: boolean;
}

/**
 * Saves the receipt data to the 'receipts' table in Supabase.
 * @param receiptData - The receipt data object.
 * @returns An object indicating the result of the save operation.
 */
export const saveReceipt = async (receiptData: ReceiptData): Promise<SaveResult> => {
    if (!supabase) {
        return { isDuplicate: false, error: 'Supabase not configured.', notConfigured: true };
    }
    
    const unique_hash = createReceiptHash(receiptData);

    const { data, error } = await supabase
        .from('receipts')
        .insert({
            merchant_name: receiptData.merchantName,
            date: receiptData.date,
            total: receiptData.total,
            items: receiptData.items,
            unique_hash: unique_hash,
        })
        .select();

    if (error) {
        // 23505 is the PostgreSQL error code for a unique_violation
        if (error.code === '23505') {
            console.warn('Duplicate receipt detected based on unique_hash.');
            return { isDuplicate: true, error: null };
        }
        console.error('Error saving receipt to Supabase:', error);
        return { isDuplicate: false, error };
    }

    console.log('Receipt saved successfully:', data);
    return { isDuplicate: false, error: null };
};

/**
 * Fetches all receipts from the 'receipts' table in Supabase.
 * @returns A promise that resolves to an array of receipt data.
 */
export const getReceipts = async (): Promise<ReceiptData[]> => {
    if (!supabase) {
        throw new Error("Supabase not configured.");
    }

    const { data, error } = await supabase
        .from('receipts')
        .select('id, merchant_name, date, total, items')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching receipts:', error);
        throw new Error('Failed to fetch receipts from the database.');
    }

    return data.map(item => ({
        id: item.id,
        merchantName: item.merchant_name,
        date: item.date,
        total: item.total,
        items: item.items
    })) as ReceiptData[];
};