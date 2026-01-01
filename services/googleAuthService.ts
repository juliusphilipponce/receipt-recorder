/**
 * Google Authentication Service
 * Handles OAuth 2.0 authentication using Google Identity Services (GIS)
 * Manages access tokens for Google Drive and Sheets APIs
 */

// Google Identity Services types
declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: TokenClientConfig) => TokenClient;
                };
            };
        };
    }
}

interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: any) => void;
}

interface TokenClient {
    requestAccessToken: () => void;
}

interface TokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    error?: string;
}

// Required OAuth scopes for the application
const REQUIRED_SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets'
].join(' ');

class GoogleAuthService {
    private accessToken: string | null = null;
    private tokenClient: TokenClient | null = null;
    private tokenExpiryTime: number | null = null;

    /**
     * Initialize the Google Identity Services token client
     */
    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Wait for Google Identity Services to load
            const checkGoogleLoaded = setInterval(() => {
                if (window.google?.accounts?.oauth2) {
                    clearInterval(checkGoogleLoaded);

                    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

                    if (!clientId) {
                        reject(new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env.local'));
                        return;
                    }

                    try {
                        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
                            client_id: clientId,
                            scope: REQUIRED_SCOPES,
                            callback: (response: TokenResponse) => {
                                if (response.error) {
                                    console.error('Token error:', response.error);
                                    return;
                                }
                                this.accessToken = response.access_token;
                                // Calculate expiry time (current time + expires_in seconds)
                                this.tokenExpiryTime = Date.now() + (response.expires_in * 1000);
                                console.log('✅ Google authentication successful');
                            },
                            error_callback: (error: any) => {
                                console.error('Google auth error:', error);
                            }
                        });
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkGoogleLoaded);
                reject(new Error('Google Identity Services failed to load'));
            }, 10000);
        });
    }

    /**
     * Request user authorization and get access token
     */
    async authenticate(): Promise<string> {
        // Check if token is still valid
        if (this.accessToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime) {
            return this.accessToken;
        }

        // Initialize if not already done
        if (!this.tokenClient) {
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            if (!this.tokenClient) {
                reject(new Error('Token client not initialized'));
                return;
            }

            // Set up a one-time callback for this authentication request
            const originalCallback = this.tokenClient;

            // Create a promise that resolves when token is received
            const tokenPromise = new Promise<string>((resolveToken) => {
                const checkToken = setInterval(() => {
                    if (this.accessToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime) {
                        clearInterval(checkToken);
                        resolveToken(this.accessToken);
                    }
                }, 100);

                // Timeout after 60 seconds
                setTimeout(() => {
                    clearInterval(checkToken);
                    reject(new Error('Authentication timeout'));
                }, 60000);
            });

            // Request access token (this will show Google's OAuth popup)
            this.tokenClient.requestAccessToken();

            tokenPromise.then(resolve).catch(reject);
        });
    }

    /**
     * Get the current access token (if available and valid)
     */
    getAccessToken(): string | null {
        if (this.accessToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime) {
            return this.accessToken;
        }
        return null;
    }

    /**
     * Check if user is currently authenticated
     */
    isAuthenticated(): boolean {
        return this.getAccessToken() !== null;
    }

    /**
     * Clear the current access token (logout)
     */
    logout(): void {
        this.accessToken = null;
        this.tokenExpiryTime = null;
    }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();
