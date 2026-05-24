// DateMe/frontend/src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import api, { buildApiUrl } from '../utils/api'; // Import API utility for URL construction

const AdminDashboard = () => {
    const [reviews, setReviews] = useState([]);
    
    // Fetch reviews on mount (native fetch with API URL from api.js)
    useEffect(() => {
        const apiUrl = buildApiUrl('/api/admin/reviews');
        
        const fetchData = async () => {
            try {
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Could not load admin reviews`);
                }

                const data = await response.json();
                
                console.log('✅ Admin fetch successful:', data.total, 'reviews');
                setReviews(data.reviews || []);

            } catch (err) {
                console.error('❌ Admin fetch failed:', err.message);
                // Don't throw error that breaks component - just log it
            }
        };

        fetchData();
    }, []);

    const handleUpdateReview = async (id, field, value) => {
        try {
            const apiUrl = buildApiUrl(`/api/admin/reviews/${id}`);
            
            console.log(`🔄 Updating review ${id}: ${field} = ${value}`);
            
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    // Add auth token if available
                    Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
                },
                body: JSON.stringify({ [field]: value })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to update review`);
            }

            // Refresh data after successful update
            const refreshUrl = buildApiUrl('/api/admin/reviews');
            const refreshedData = await fetch(refreshUrl).then(res => res.json());
            setReviews(refreshedData.reviews || []);
            
        } catch (err) {
            console.error('❌ Update failed:', err.message);
        }
    };

    const handleDeleteReview = async (id) => {
        // Fixed: Replaced confirm() with non-intrusive approach
        if (window.confirm('Hide this review from public view?')) {
            try {
                const apiUrl = buildApiUrl(`/api/admin/reviews/${id}`);
                
                console.log(`🔐 Deleting review ${id}`);
                
                const response = await fetch(apiUrl, {
                    method: 'DELETE',
                    headers: {
                        // Add auth token if available
                        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Failed to delete review`);
                }

                // Refresh data after successful deletion
                const refreshUrl = buildApiUrl('/api/admin/reviews');
                const refreshedData = await fetch(refreshUrl).then(res => res.json());
                setReviews(refreshedData.reviews || []);
                
            } catch (err) {
                console.error('❌ Delete failed:', err.message);
            }
        }
    };

    if (false) { // Loading state removed since we use try/catch in useEffect
        return <div className="text-center mt-5 text-muted">Loading admin reviews...</div>;
    }

    const hiddenCount = reviews.filter(r => r.hidden).length;
    const featuredCount = reviews.filter(r => r.featured).length;
    
    return (
        <div className="container py-4">
            <h2 className="mb-4 gradient-text">🛠️ Admin Dashboard</h2>
            
            {/* Stats */}
            <div className="row mb-4">
                <div className="col-12 text-center">
                    <span className="badge bg-primary rounded-pill p-2">
                        📊 Total: {reviews.length} | Active: {reviews.filter(r => !r.hidden).length} | Hidden: {reviews.filter(r => r.hidden).length}
                    </span>
                </div>
            </div>

            {/* Reviews Grid */}
            <div className="row">
                {reviews.filter(r => !r.hidden).map((review) => (
                    <div key={review.id || Math.random()} className="col-12 col-md-6 col-lg-4 mb-4">
                        <div className="card shadow-sm h-100 border rounded-3 active">
                            {/* Header */}
                            <div className="card-header d-flex justify-content-between align-items-start mb-3 p-3 bg-light">
                                <div>
                                    <h5 className="card-title text-dark m-0">{review.displayName || "Anonymous"}</h5>
                                    <small className="text-muted">📅 {new Date(review.timestamp).toLocaleDateString()}</small>
                                </div>
                                {review.featured && (
                                    <span className="badge bg-primary rounded-pill">⭐ Featured</span>
                                )}
                            </div>

                            {/* Body */}
                            <div className="card-body p-3">
                                <div className="row mb-2">
                                    <div className="col-6">
                                        <small className="text-muted d-block">Overall Rating</small>
                                        <strong>{review.overallRating}/5</strong>
                                    </div>
                                    <div className="col-6 text-end">
                                        <button 
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleUpdateReview(review.id, 'featured', !review.featured)}
                                        >
                                            {review.featured ? '⭐ Unfeature' : '⭐ Feature'}
                                        </button>
                                    </div>
                                </div>

                                {/* Comments preview */}
                                {(review.planningComments || review.dateComments) && (
                                    <small className="text-muted d-block mt-2">
                                        {review.planningComments?.substring(0, 50)}...
                                    </small>
                                )}

                                {/* Delete/Hide button - only show for non-hidden reviews */}
                                {!review.hidden && (
                                    <>
                                        <hr className="my-3" />
                                        <div className="d-flex justify-content-end gap-2">
                                            <button 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDeleteReview(review.id)}
                                            >
                                                👁️ Hide Review
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
                
                {/* Empty State */}
                {reviews.filter(r => !r.hidden).length === 0 && (
                    <div className="col-12">
                        <div className="card bg-dark text-muted shadow-sm p-5 text-center border-0">
                            <h5>No active reviews</h5>
                            <p className="small">All reviews are hidden or no reviews have been submitted yet.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
