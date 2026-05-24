// DateMe/frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import ReviewList from './components/ReviewList';
import AdminDashboard from './components/AdminDashboard';
import LoginFormModal from './components/LoginFormModal';
import ReviewFormModal from './components/ReviewFormModal';
import api, { buildApiUrl } from './utils/api'; // Import API utility for URL construction

console.log('🚀 App starting...');

function App() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [configLoaded, setConfigLoaded] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [config, setConfig] = useState(null);
    const [showReviewFormModal, setShowReviewFormModal] = useState(false);

    // ✅ Check for existing token on mount (first-time login check)
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        
        if (storedToken) {
            console.log('🔑 Found existing auth token from previous session');
            setIsAdminMode(true); // Auto-login if valid token exists
        }
    }, []);

    // ✅ Load dynamic config on mount using native fetch (API URL managed by api.js)
    useEffect(() => {
        const apiUrl = buildApiUrl('/api/admin/settings');
        
        const fetchData = async () => {
            try {
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setConfig(data);
                setConfigLoaded(true);
                console.log('✅ Config loaded:', data.siteConfig?.title || 'DateME Reviews');
            } catch (err) {
                console.error('❌ Failed to fetch settings:', err.message);
                setConfigLoaded(true); // Continue with default config
            }
        };

        fetchData();
    }, []);

    // ✅ Fetch reviews only when not in admin mode (native fetch with API URL from api.js)
    useEffect(() => {
        if (!isAdminMode) {
            const apiUrl = buildApiUrl('/api/reviews');
            
            const fetchData = async () => {
                setLoading(true);
                
                try {
                    const response = await fetch(apiUrl);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    setReviews(data);
                    console.log('✅ Reviews loaded:', data.length);
                } catch (err) {
                    console.error('❌ Failed to fetch reviews:', err.message);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [isAdminMode]);

    // ✅ Check if token is expired (setInterval every minute)
    useEffect(() => {
        const checkTokenExpiry = () => {
            const token = localStorage.getItem('authToken');
            if (!token || !isAdminMode) return;

            try {
                // Decode JWT without verifying signature (just check expiry)
                const parts = token.split('.');
                const payload = JSON.parse(atob(parts[1]));
                
                const expirationTime = payload.exp * 1000; // Convert to milliseconds
                
                if (Date.now() >= expirationTime) {
                    console.log('⏰ Token expired - auto-logging out');
                    logout();
                }
            } catch (err) {
                // Ignore errors when decoding token
            }
        };

        const interval = setInterval(checkTokenExpiry, 60000); // Check every minute
        
        return () => clearInterval(interval); // Cleanup on unmount
    }, [isAdminMode]);

    // ✅ Open login modal
    const handleOpenLoginModal = () => {
        console.log('🔐 Admin Login button clicked');
        setShowLoginModal(true);
    };

    // ✅ Close login modal
    const handleCloseLoginModal = () => {
        console.log('❌ Admin Login modal closed');
        setShowLoginModal(false);
    };

    // ✅ Open review form modal
    const handleOpenReviewFormModal = () => {
        console.log('💬 Review form button clicked');
        setShowReviewFormModal(true);
    };

    // ✅ Close review form modal
    const handleCloseReviewFormModal = () => {
        console.log('❌ Review form modal closed');
        setShowReviewFormModal(false);
    };

    // ✅ Handle successful login (called after backend validates password)
    const handleLoginSuccess = (data) => {
        console.log('✅ Admin login successful from modal:', data.username);
        
        setIsAdminMode(true);
        handleCloseLoginModal();
        window.location.hash = '#admin';
    };

    // ✅ Handle logout
    const logout = () => {
        console.log('🔓 Admin logout clicked');
        
        // Remove token and clear state
        localStorage.removeItem('authToken');
        
        setIsAdminMode(false);
        handleCloseLoginModal();
        window.location.hash = '';
        
        // Optionally redirect to homepage
        setTimeout(() => {
            window.location.href = 'http://localhost:3000/';
        }, 100);
    };

    return configLoaded ? (
        <div className="App container py-4">
            {/* Navigation Bar */}
            <nav className="navbar navbar-light bg-dark mb-3 shadow-sm p-3 rounded-3 border border-secondary">
                <div className="container-fluid">
                    <span 
                        className="navbar-brand h1 text-white m-0 cursor-pointer" 
                        onClick={() => window.location.hash = ''}
                        style={{ fontFamily: 'Segoe UI', letterSpacing: '2px' }}
                    >
                        {/* "Date" - gradient effect */}
                        <span 
                            className="gradient-text mx-1" 
                            style={{ fontWeight: 500, letterSpacing: '1px' }}
                        >
                            Maddie's
                        </span>

                        {/* " Reviews" - gradient effect again */}
                        <span 
                            className="gradient-text mx-1" 
                            style={{ fontWeight: 500, letterSpacing: '1px' }}
                        >
                            Reviews
                        </span>
                    </span>

                    {/* Navigation Links */}
                    <div className="d-flex gap-3 ms-auto align-items-center">
                        {!isAdminMode ? (
                            <>
                                <button 
                                    className="btn btn-outline-primary rounded-pill px-4"
                                    onClick={handleOpenLoginModal}
                                >
                                    🛠️ Admin Login
                                </button>
                                <button 
                                    className="btn btn-outline-info rounded-pill px-4"
                                    onClick={handleOpenReviewFormModal}
                                    disabled={loading || error}
                                >
                                    💬 Submit Review
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="badge bg-primary rounded-pill px-3">
                                    🛠️ Admin Mode
                                </span>
                                <button 
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={logout}
                                >
                                    🔓 Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Public View */}
            {isAdminMode ? (
                <AdminDashboard debug={true} />
            ) : (
                /* Public View */
                <>
                    {/* Stats Summary */}
                    <div className="row mb-3">
                        <div className="col-12 text-center">
                            {loading ? (
                                <span className="badge bg-primary rounded-pill p-2">Loading...</span>
                            ) : error ? (
                                <span className="badge bg-danger rounded-pill p-2">
                                    ❌ Error: {error}
                                </span>
                            ) : (
                                <span className="badge bg-primary rounded-pill p-2">
                                    📊 Total Reviews: {reviews.length}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Review Grid */}
                    {loading ? (
                        <div className="text-center mt-5 text-muted">Loading reviews...</div>
                    ) : error ? (
                        <div className="card bg-danger text-white shadow-sm p-3">
                            <strong>⚠️ Warning:</strong> Could not load reviews. Check browser console for errors.
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center mt-5 text-muted">No reviews found.</div>
                    ) : (
                        <ReviewList reviews={reviews} />
                    )}

                    {/* Login Modal */}
                    <LoginFormModal 
                        isOpen={showLoginModal}
                        onClose={handleCloseLoginModal}
                        onLoginSuccess={handleLoginSuccess}
                    />
                    
                    {/* Review Form Modal */}
                    <ReviewFormModal 
                        isOpen={showReviewFormModal}
                        onClose={handleCloseReviewFormModal}
                        onFormSubmit={(reviewId) => {
                            console.log('✅ Review submitted successfully, ID:', reviewId);
                            // Optionally show success message or redirect
                            alert('🎉 Thank you for your review! Your feedback has been recorded.');
                        }}
                    />

                </>
            )}

            {/* Footer */}
            <footer className="text-center text-muted py-3 mt-4 border-top border-secondary">
                <small className="d-block">© {new Date().getFullYear()} DateME Reviews</small>
            </footer>
        </div>
    ) : (
        // Fallback loading state for config
        <div className="text-center p-5">Loading site configuration...</div>
    );
}

export default App;
