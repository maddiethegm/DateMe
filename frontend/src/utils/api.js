// DateMe/frontend/src/utils/api.js - API CLIENT UTILITIES (SIMPLIFIED FOR DEPLOYMENT)

// ✅ Load deployment base URL from environment or default to localhost
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ✅ Helper function for constructing API URLs (used by all components)
export const buildApiUrl = (endpoint) => {
    return `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

// Export the base URL itself if needed directly
export const getBaseUrl = () => BASE_URL;
