/**
 * Google Drive Service
 * Handles file uploads to Google Drive
 * Creates and manages the "Receipt Scanner Uploads" folder
 */

import { googleAuthService } from './googleAuthService';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_NAME = 'Receipt Scanner Uploads';

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
    webContentLink?: string;
}

interface UploadResult {
    fileId: string;
    fileName: string;
    webViewLink: string;
}

class GoogleDriveService {
    private folderId: string | null = null;

    /**
     * Find or create the "Receipt Scanner Uploads" folder
     */
    private async ensureFolder(accessToken: string): Promise<string> {
        // Return cached folder ID if available
        if (this.folderId) {
            return this.folderId;
        }

        // Check if folder exists
        const searchResponse = await fetch(
            `${DRIVE_API_BASE}/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!searchResponse.ok) {
            throw new Error(`Failed to search for folder: ${searchResponse.statusText}`);
        }

        const searchData = await searchResponse.json();

        // If folder exists, use it
        if (searchData.files && searchData.files.length > 0) {
            this.folderId = searchData.files[0].id;
            console.log(`📁 Found existing folder: ${FOLDER_NAME} (${this.folderId})`);
            return this.folderId;
        }

        // Create new folder
        const createResponse = await fetch(`${DRIVE_API_BASE}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            })
        });

        if (!createResponse.ok) {
            throw new Error(`Failed to create folder: ${createResponse.statusText}`);
        }

        const folderData = await createResponse.json();
        this.folderId = folderData.id;
        console.log(`📁 Created new folder: ${FOLDER_NAME} (${this.folderId})`);
        return this.folderId;
    }

    /**
     * Generate a filename for the receipt image
     * Format: YYYY-MM-DD_MerchantName_timestamp.ext
     */
    private generateFileName(merchantName: string, date: string, originalFile: File): string {
        const timestamp = Date.now();
        const extension = originalFile.name.split('.').pop() || 'jpg';
        const sanitizedMerchant = merchantName.replace(/[^a-zA-Z0-9]/g, '_');
        return `${date}_${sanitizedMerchant}_${timestamp}.${extension}`;
    }

    /**
     * Upload an image file to Google Drive
     */
    async uploadImage(
        file: File,
        merchantName: string,
        date: string
    ): Promise<UploadResult> {
        // Ensure user is authenticated
        const accessToken = await googleAuthService.authenticate();

        // Ensure folder exists
        const folderId = await this.ensureFolder(accessToken);

        // Generate filename
        const fileName = this.generateFileName(merchantName, date, file);

        // Create metadata
        const metadata = {
            name: fileName,
            parents: [folderId]
        };

        // Create multipart upload using Blob for binary data
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        // Build multipart body parts as Uint8Array to preserve binary data
        const metadataPart = new TextEncoder().encode(
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            `Content-Type: ${file.type}\r\n\r\n`
        );

        const fileBuffer = await file.arrayBuffer();
        const filePart = new Uint8Array(fileBuffer);
        const closePart = new TextEncoder().encode(closeDelimiter);

        // Combine all parts into a single Blob
        const multipartBody = new Blob([metadataPart, filePart, closePart]);

        // Upload file
        const uploadResponse = await fetch(
            `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,webViewLink`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`
                },
                body: multipartBody
            }
        );

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Failed to upload file: ${uploadResponse.statusText} - ${errorText}`);
        }

        const uploadData = await uploadResponse.json();

        console.log(`✅ Uploaded to Drive: ${fileName} (${uploadData.id})`);

        return {
            fileId: uploadData.id,
            fileName: uploadData.name,
            webViewLink: uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`
        };
    }

    /**
     * Make a file publicly accessible (optional)
     */
    async makePublic(fileId: string): Promise<void> {
        const accessToken = googleAuthService.getAccessToken();
        if (!accessToken) {
            throw new Error('Not authenticated');
        }

        await fetch(`${DRIVE_API_BASE}/files/${fileId}/permissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: 'reader',
                type: 'anyone'
            })
        });
    }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
