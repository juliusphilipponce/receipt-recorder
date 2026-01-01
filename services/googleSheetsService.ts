/**
 * Google Sheets Service
 * Handles logging receipt data to Google Sheets
 * Creates and manages the receipt tracking spreadsheet
 */

import { googleAuthService } from './googleAuthService';
import { ReceiptData } from '../types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const SPREADSHEET_TITLE = 'Receipt Scanner - Records';
const SHEET_NAME = 'Receipts';

// Column headers for the spreadsheet
const HEADERS = [
    'Date',
    'Merchant',
    'Total',
    'Items',
    'Notes',
    'Image Link',
    'Created At'
];

interface SpreadsheetInfo {
    spreadsheetId: string;
    spreadsheetUrl: string;
}

class GoogleSheetsService {
    private spreadsheetId: string | null = null;

    /**
     * Get spreadsheet ID from localStorage or create new spreadsheet
     */
    private async ensureSpreadsheet(accessToken: string): Promise<string> {
        // Check localStorage for existing spreadsheet ID
        const storedId = localStorage.getItem('googleSheetsId');

        if (storedId) {
            // Verify the spreadsheet still exists
            try {
                const response = await fetch(
                    `${SHEETS_API_BASE}/${storedId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    }
                );

                if (response.ok) {
                    this.spreadsheetId = storedId;
                    console.log(`📊 Using existing spreadsheet: ${storedId}`);
                    return storedId;
                }
            } catch (error) {
                console.warn('Stored spreadsheet not found, creating new one');
                localStorage.removeItem('googleSheetsId');
            }
        }

        // Create new spreadsheet
        const createResponse = await fetch(SHEETS_API_BASE, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    title: SPREADSHEET_TITLE
                },
                sheets: [
                    {
                        properties: {
                            title: SHEET_NAME
                        }
                    }
                ]
            })
        });

        if (!createResponse.ok) {
            throw new Error(`Failed to create spreadsheet: ${createResponse.statusText}`);
        }

        const spreadsheetData = await createResponse.json();
        this.spreadsheetId = spreadsheetData.spreadsheetId;

        // Store in localStorage
        localStorage.setItem('googleSheetsId', this.spreadsheetId);

        console.log(`📊 Created new spreadsheet: ${SPREADSHEET_TITLE} (${this.spreadsheetId})`);

        // Add headers to the new spreadsheet
        await this.addHeaders(accessToken, this.spreadsheetId);

        return this.spreadsheetId;
    }

    /**
     * Add header row to the spreadsheet
     */
    private async addHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
        await fetch(
            `${SHEETS_API_BASE}/${spreadsheetId}/values/${SHEET_NAME}!A1:G1?valueInputOption=RAW`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [HEADERS]
                })
            }
        );

        // Format header row (bold)
        await fetch(
            `${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: [
                        {
                            repeatCell: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: 0,
                                    endRowIndex: 1
                                },
                                cell: {
                                    userEnteredFormat: {
                                        textFormat: {
                                            bold: true
                                        }
                                    }
                                },
                                fields: 'userEnteredFormat.textFormat.bold'
                            }
                        }
                    ]
                })
            }
        );
    }

    /**
     * Format items array as a readable string
     */
    private formatItems(items: { name: string; price: number }[]): string {
        return items.map(item => `${item.name} ($${item.price.toFixed(2)})`).join(', ');
    }

    /**
     * Add a receipt record to the spreadsheet
     */
    async addReceipt(
        receiptData: ReceiptData,
        imageLink?: string
    ): Promise<void> {
        // Ensure user is authenticated
        const accessToken = await googleAuthService.authenticate();

        // Ensure spreadsheet exists
        const spreadsheetId = await this.ensureSpreadsheet(accessToken);

        // Prepare row data
        const rowData = [
            receiptData.date,
            receiptData.merchantName,
            receiptData.total,
            this.formatItems(receiptData.items),
            receiptData.notes || '',
            imageLink || receiptData.imageUrl || '',
            new Date().toISOString()
        ];

        // Append row to spreadsheet
        const appendResponse = await fetch(
            `${SHEETS_API_BASE}/${spreadsheetId}/values/${SHEET_NAME}!A:G:append?valueInputOption=USER_ENTERED`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [rowData]
                })
            }
        );

        if (!appendResponse.ok) {
            const errorText = await appendResponse.text();
            console.error('❌ Sheets append failed:', {
                status: appendResponse.status,
                statusText: appendResponse.statusText,
                error: errorText,
                spreadsheetId,
                rowData
            });
            throw new Error(`Failed to append to spreadsheet: ${appendResponse.statusText} - ${errorText}`);
        }

        const result = await appendResponse.json();
        console.log(`✅ Added to Google Sheets: ${receiptData.merchantName} - $${receiptData.total}`);
    }

    /**
     * Get the spreadsheet URL for the user to view
     */
    getSpreadsheetUrl(): string | null {
        const id = this.spreadsheetId || localStorage.getItem('googleSheetsId');
        return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null;
    }

    /**
     * Reset the spreadsheet (for testing or user preference)
     */
    resetSpreadsheet(): void {
        localStorage.removeItem('googleSheetsId');
        this.spreadsheetId = null;
        console.log('🔄 Spreadsheet reference cleared');
    }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
