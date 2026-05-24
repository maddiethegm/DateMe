// DateMe/frontend/src/components/LoginFormModal.jsx
import React, { useState } from 'react';
import api, { buildApiUrl } from '../utils/api'; // Import API utility for URL construction

const LoginFormModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate inputs
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        // Clear previous errors
        setError('');
        setLoading(true);

        try {
            console.log('🔐 Attempting login:', `${username} / ${password}`);

            const apiUrl = buildApiUrl('/api/admin/login');

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                
                console.log('✅ Login successful:', data.username);

                // ✅ Store token in localStorage for authenticated requests
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }
                
                // Close modal
                onClose();
                
                // Notify parent of success
                onLoginSuccess(data);
            } else {
                const errData = await response.json().catch(() => ({ error: 'Authentication failed' }));
                setError(errData.error || errData.message || 'Invalid username or password');
                console.log('❌ Login failed:', errData);
            }

        } catch (err) {
            console.error('❌ Network error during login:', err.message);
            setError(err.message || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleClearForm = () => {
        setUsername('');
        setPassword('');
        setError('');
    };

    if (!isOpen) return null; // Don't render when modal is closed

    return (
        <div className="modal d-block" style={{ display: 'block' }} tabIndex="-1">
            
            {/* Modal dialog */}
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-3 border-0 shadow-lg">
                    
                    {/* Modal header */}
                    <div className="modal-header border-bottom-0">
                        <h5 className="modal-title gradient-text fw-bold">
                            🔐 Admin Login
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                            aria-label="Close"
                        ></button>
                    </div>

                    {/* Modal body */}
                    <div className="modal-body p-4">
                        
                        {error && (
                            <div className="alert alert-danger mb-3 rounded-pill shadow-sm" role="alert">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label text-muted small fw-semibold">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    className="form-control border-primary"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your admin username"
                                    autoFocus
                                    autoComplete="username"
                                    disabled={loading}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="password" className="form-label text-muted small fw-semibold">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-control border-primary"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
                            </div>

                            <div className="d-grid gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary rounded-pill shadow-sm py-2"
                                    disabled={loading}
                                >
                                    {loading ? '🔄 Verifying...' : '🔐 Login'}
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-pill"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    ❌ Cancel
                                </button>
                            </div>
                        </form>

                        {/* Help text */}
                        <div className="text-center mt-3 p-2 bg-light rounded">
                            <small className="text-muted">
                                Default username: <code>adminuser</code> (default password: admin123)
                            </small>
                        </div>
                    </div>

                    {/* Modal footer */}
                    <div className="modal-footer border-top-0 justify-content-center p-0">
                        {/* Empty footer to keep modal clean */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginFormModal;
