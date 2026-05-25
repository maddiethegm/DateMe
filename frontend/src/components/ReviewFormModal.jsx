// DateMe/frontend/src/components/ReviewFormModal.jsx - REVIEW FORM COMPONENT (UPDATED WITH displayName)
import React, { useState } from 'react';
import api, { buildApiUrl } from '../utils/api'; // Import API utility for URL construction


const ReviewFormModal = ({ isOpen, onClose, onFormSubmit }) => {
    const [formData, setFormData] = useState({
        // User info (optional but recommended for better reviews)
        displayName: '',  // ✅ REMOVED '//' comment, keeping state
        
        // Location and date
        location: '',
        date: '',
        
        // Payment responsibility
        paymentResponsibility: '',
        
        // ✅ NEW FIELD 1: Overall Experience (1-5) rating
        overallExperience: 3,
        
        // RATING FIELDS - ALL USING DROPDOWN SELECTS (1-5)
        overallRating: 3,
        planningRating: 3,
        smallTalkRating: 3,
        safetyRating: 3,
        connectionRating: 3,
        
        // ✅ NEW FIELD 2: Would See Again (Yes/No/Maybe)
        wouldSeeAgain: '',
        
        // Optional text fields
        dateComments: '',
        postDateComments: '',
        adviceForOthers: '',
        adviceForMaddie: ''
    });


    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);


    // ✅ VALIDATE FORM BEFORE SUBMISSION (Added new field validation)
    const validateForm = () => {
        const newErrors = {};
        
        // Check required rating fields have values (1-5)
        ['overallRating', 'planningRating', 'smallTalkRating', 'safetyRating', 'connectionRating'].forEach(field => {
            if (!formData[field] || formData[field] < 1 || formData[field] > 5) {
                newErrors[`${field}Rating`] = 'Select a rating (1-5)';
            }
        });
        
        // ✅ NEW: Check overall experience field
        if (!formData.overallExperience || formData.overallExperience < 1 || formData.overallExperience > 5) {
            newErrors['overallExperience'] = 'Please select an Overall Experience rating (1-5)';
        }
        
/*        // ✅ NEW: Check would see again field
        if (!formData.wouldSeeAgain || !['yes', 'no', 'maybe', ''].includes(formData.wouldSeeAgain)) {
            newErrors['wouldSeeAgain'] = 'Please select whether you would see this person again (yes/no/maybe)';
        }*/


        // Check location is filled in
        if (!formData.location.trim()) {
            newErrors.location = 'Please enter your location';
        }

        // ✅ FIX: Validation should pass even if displayName is empty!
        // We only error if they typed something but it's invalid (which won't happen here)
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    // ✅ Handle form submission to backend API
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate before submit
        if (!validateForm()) {
            setErrors({ overall: 'Please fill in all required fields' });
            return;
        }
        
        setLoading(true);


        try {
            console.log('📤 Submitting review to backend API...');


            const formattedFormData = {
                ...formData,
                
                // Generate timestamp for this submission
                timestamp: new Date().toISOString(),
                
                // Set defaults if not provided
                hidden: false,
                featured: false,
                adminComment: "",
                status: "public_submission",
                
                // ✅ FIX: Only generate ID if displayName is empty (for anonymous users)
                id: formData.displayName || Math.random().toString(36).substring(2, 8)
            };


            console.log('📦 Review data to submit:', JSON.stringify(formattedFormData, null, 2));


            // ✅ API ENDPOINT for public review submission (new endpoint needed in backend)
            const response = await fetch(buildApiUrl('/api/submit/review'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formattedFormData)
            });


            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Review submission failed:', errorText);
                
                // Try admin upload endpoint as fallback (if user has some session token)
                try {
                    // First, get current user info from auth endpoint
                    const authUrl = buildApiUrl('/api/admin/me');
                    const authResponse = await fetch(authUrl);
                    let authToken = null;
                    
                    if (authResponse.ok) {
                        const userData = await authResponse.json();
                        console.log('✅ User authenticated:', userData.username);
                        
                        // Try admin upload endpoint with auth token
                        const uploadUrl = buildApiUrl('/api/admin/reviews/upload');
                        const response2 = await fetch(uploadUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify({ reviews: [formattedFormData] })
                        });


                        if (response2.ok) {
                            console.log('✅ Review uploaded via admin endpoint');
                            
                            // Close modal and notify parent of success
                            onClose();
                            onFormSubmit?.(formattedFormData.id);
                            
                            return;
                        }
                    }
                    
                } catch (authError) {
                    console.error('❌ Failed to use admin upload endpoint:', authError.message);
                }
                
                // Show error message
                throw new Error('Review submission failed. Please try again.');
            }


            const result = await response.json();
            console.log('✅ Review submitted successfully:', result);
            
            // Close modal and notify parent of success
            onClose();
            onFormSubmit?.(formattedFormData.id);
            
        } catch (err) {
            console.error('❌ Error submitting review:', err.message);
            setErrors({ submitError: 'Failed to submit review. Please check your internet connection.' });
        } finally {
            setLoading(false);
        }
    };


    // ✅ Handle input changes for text fields (Same as before)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            delete errors[name];
            setErrors({});
        }
    };


    // ✅ Handle rating dropdown change - Update single rating and clear error (Same as before)
    const handleRatingChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [`${field}Rating`]: parseInt(value) || 3
        }));
        
        // Clear error when rating is changed
        if (errors[`${field}Rating`]) {
            delete errors[`${field}Rating`];
            setErrors({});
        }
    };
const handleWouldSeeAgainChange = (value) => {
    const lowerValue = value.toLowerCase();
    
    setFormData(prev => ({
        ...prev,
        wouldSeeAgain: lowerValue // Keep as string, no parseInt!
    }));
    
    if (errors['wouldSeeAgain']) {
        delete errors['wouldSeeAgain'];
        setErrors({});
    }
};


    const handleClose = () => {
        // ✅ Reset form on close (Added new fields)
        setFormData({
            displayName: '',
            location: '',
            date: '',
            paymentResponsibility: '',
            overallExperience: 3,
            overallRating: 3,
            planningRating: 3,
            smallTalkRating: 3,
            safetyRating: 3,
            connectionRating: 3,
            wouldSeeAgain: 'no',
            dateComments: '',
            postDateComments: '',
            adviceForOthers: '',
            adviceForMaddie: ''
        });
        setErrors({});
    };


    if (!isOpen) return null;


    return (
        <div className="modal d-block" style={{ display: 'block' }} tabIndex="-1">


            {/* Modal dialog */}
            <div className="modal-dialog modal-dialog-centered max-w-96">
                <div className="modal-content rounded-3 border-0 shadow-lg bg-light">
                    
                    {/* Modal header */}
                    <div className="modal-header border-bottom-0 p-4">
                        <h5 className="modal-title gradient-text fw-bold">
                            ✏️ Submit Your Review
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
                        
                        {errors.submitError && (
                            <div className="alert alert-danger mb-3 rounded-pill shadow-sm" role="alert">
                                ⚠️ {errors.submitError}
                            </div>
                        )}


                        {Object.keys(errors).length > 0 && !errors.submitError && (
                            <div className="alert alert-warning mb-3 rounded-pill shadow-sm" role="alert">
                                ⚠️ {errors.overall || 'Please fill in all required fields'}
                            </div>
                        )}


                        <form onSubmit={handleSubmit}>
                            
                            {/* Basic Information Section */}
                            <div className="mb-4">
                                <h6 className="fw-bold text-primary mb-3">📋 Basic Information</h6>
                                
                                <div className="row g-3">
                                    <div className="col-md-12">
                                        <label htmlFor="displayName" className="form-label text-muted small fw-semibold">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            id="displayName"
                                            name="displayName"
                                            className={`form-control border-primary`}
                                            value={formData.displayName}
                                            onChange={handleInputChange}
                                            placeholder="(leave empty for anonymous)"
                                        />
                                        {/* ✅ FIX: Added displayName input field */}
                                    </div>

                                    <div className="col-md-12">
                                        <label htmlFor="location" className="form-label text-muted small fw-semibold">
                                            Location (Required)
                                        </label>
                                        <input
                                            type="text"
                                            id="location"
                                            name="location"
                                            className={`form-control border-primary`}
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="e.g., The Coffee House downtown"
                                            required={!errors.location}
                                        />
                                        {errors.location && (
                                            <small className="text-danger">{errors.location}</small>
                                        )}
                                    </div>


                                    <div className="col-md-12">
                                        <label htmlFor="date" className="form-label text-muted small fw-semibold">
                                            Date of Experience (Optional)
                                        </label>
                                        <input
                                            type="date"
                                            id="date"
                                            name="date"
                                            className="form-control border-primary"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                        />
                                    </div>


                                {/*    <div className="col-md-12">
                                        <label htmlFor="paymentResponsibility" className="form-label text-muted small fw-semibold">
                                            Who Paid? (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            id="paymentResponsibility"
                                            name="paymentResponsibility"
                                            className="form-control border-primary"
                                            value={formData.paymentResponsibility}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Maddie paid for everything"
                                        />
                                    </div> */}
                                </div>
                            </div>


                            {/* Rating Section - ✅ FIXED: DROPDOWN INSTEAD OF SLIDERS */}
                            <div className="mb-4">
                                <h6 className="fw-bold text-primary mb-3">⭐ Overall Experience (1-5)</h6>
                                
                                {/* ✅ FIXED: DROPDOWN SELECT for OVERALL RATING */}
                                <div className="mb-2">
                                    <select 
                                        value={formData.overallRating}
                                        onChange={(e) => handleRatingChange('overall', e.target.value)}
                                        className="form-select border-primary bg-light"
                                        id="overallRatingSelect"
                                        style={{ width: '100%' }} // Ensure full width
                                    >
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>


                                {/* Individual Rating Breakdown - ✅ FIXED: DROPOWNS INSTEAD OF SLIDERS */}
                                <div className="row mt-4">
                                    {[
                                        { name: 'planning', label: 'Planning' },
                                        { name: 'smallTalk', label: 'Banter' },
                                        { name: 'safety', label: 'Safety' },
                                        { name: 'connection', label: 'Connection' }
                                    ].map(({ name, label }) => (
                                        <div key={name} className="col-md-3 mb-2">
                                            <label className="form-label text-muted small fw-semibold" htmlFor={`${name}RatingSelect`}>
                                                {label}:
                                            </label>
                                            
                                            {/* ✅ FIXED: DROPDOWN SELECT for EACH RATING */}
                                            <select 
                                                value={formData[`${name}Rating`]}
                                                onChange={(e) => handleRatingChange(name, e.target.value)}
                                                className="form-select border-primary bg-light"
                                                id={`${name}RatingSelect`}
                                                style={{ width: '100%' }} // Ensure full width
                                            >
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>


                            {/* ✅ NEW SECTION: Would See Again (Yes/No/Maybe) */}
                            <div className="mb-4">
                                <h6 className="fw-bold text-primary mb-3">🔄 Would You See Maddie Again?</h6>
                                
                                {/* ✅ NEW FIELD: Would See Again Dropdown */}
                                <div className="mb-2">
                                    <select 
                                        value={formData.wouldSeeAgain}
                                        onChange={(e) => handleWouldSeeAgainChange(e.target.value)}
                                        className="form-select border-primary bg-light"
                                        id="wouldSeeAgainSelect"
                                        style={{ width: '100%' }} // Ensure full width
                                    >
                                        <option value=""></option>
                                        <option value="yes">😊 Yes, I'd see her again</option>
                                        <option value="no">😕 No, probably not</option>
                                        <option value="maybe">🤷 Maybe...</option>
                                    </select>
                                </div>
                            </div>


                            {/* Comments Section */}
                            <div className="mb-4">
                                <h6 className="fw-bold text-primary mb-3">💬 Your Thoughts</h6>
                                
                                <div className="mb-3">
                                    <label htmlFor="dateComments" className="form-label text-muted small fw-semibold">
                                        Date Experience
                                    </label>
                                    <textarea
                                        id="dateComments"
                                        name="dateComments"
                                        className="form-control border-primary"
                                        rows={2}
                                        value={formData.dateComments}
                                        onChange={handleInputChange}
                                        placeholder="What happened during the date?"
                                    ></textarea>
                                </div>


                                <div className="mb-3">
                                    <label htmlFor="postDateComments" className="form-label text-muted small fw-semibold">
                                        Post-Date Experience
                                    </label>
                                    <textarea
                                        id="postDateComments"
                                        name="postDateComments"
                                        className="form-control border-primary"
                                        rows={2}
                                        value={formData.postDateComments}
                                        onChange={handleInputChange}
                                        placeholder="How have you felt about the interactions since your date?"
                                    ></textarea>
                                </div>


                                <div className="mb-3">
                                    <label htmlFor="adviceForOthers" className="form-label text-muted small fw-semibold">
                                        Advice for Others
                                    </label>
                                    <textarea
                                        id="adviceForOthers"
                                        name="adviceForOthers"
                                        className="form-control border-primary"
                                        rows={2}
                                        value={formData.adviceForOthers}
                                        onChange={handleInputChange}
                                        placeholder="What would you suggest to others going on a similar date?"
                                    ></textarea>
                                </div>


                                <div className="mb-3">
                                    <label htmlFor="adviceForMaddie" className="form-label text-muted small fw-semibold">
                                        Message for Maddie
                                    </label>
                                    <textarea
                                        id="adviceForMaddie"
                                        name="adviceForMaddie"
                                        className="form-control border-primary"
                                        rows={2}
                                        value={formData.adviceForMaddie}
                                        onChange={handleInputChange}
                                        placeholder="Any specific message for Maddie?"
                                    ></textarea>
                                </div>
                            </div>


                            {/* Submit Button */}
                            <div className="d-grid gap-2 mt-4">
                                <button
                                    type="submit"
                                    className="btn btn-primary rounded-pill shadow-sm py-2 fw-semibold"
                                    disabled={loading || submitting}
                                >
                                    {loading ? '🔄 Checking...' : submitting ? '✉️ Submitting...' : '✅ Submit Review'}
                                </button>


                                <button
                                    type="button"
                                    className="btn btn-outline-secondary rounded-pill"
                                    onClick={onClose}
                                    disabled={loading || submitting}
                                >
                                    ❌ Cancel
                                </button>
                            </div>
                        </form>
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


export default ReviewFormModal;