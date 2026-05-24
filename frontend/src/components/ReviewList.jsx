// DateMe/frontend/src/components/ReviewList.jsx - REVIEW DISPLAY COMPONENT
import React from 'react';

const ReviewList = ({ reviews }) => {
    return (
        <div className="row">
            {reviews.map((review, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-4 mb-4">
                    <div className="card shadow-sm h-100 border rounded-3 active">
                        {/* Card Header */}
                        <div className="card-header d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 className="card-title gradient-text m-0">
                                    {review.displayName || "Anonymous user"}
                                </h5>
                                <p className='small mb-1'>Submitted on:</p>
                                <p className="mt-1 mb-0">
                                    📅 {new Date(review.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                            {/* Rating Badge */}
                            <span className={`badge rounded-pill p-2 ${
                                review.overallRating >= 4 ? 'bg-success' : 
                                review.overallRating >= 3 ? 'bg-warning text-dark' : 'bg-danger'
                            }`}>
                                ⭐ {review.overallRating}/5
                            </span>
                        </div>

                        {/* Key Details */}
                        <div className="card-body">
                            {review.location && (
                                <div className="mb-3">
                                    <p className="text-muted small mb-1">📍 Location:</p>
                                    <p className="fw-semibold">{review.location}</p>
                                </div>
                            )}
                            
                            {review.date && (
                                <div className="mb-3">
                                    <p className="text-muted small mb-1">🗓️ Date:</p>
                                    <p>{review.date}</p>
                                </div>
                            )}

                            {review.paymentResponsibility && (
                                <div className="mb-4">
                                    <p className="text-muted small mb-1">💰 {review.paymentResponsibility} for activities</p>
                                </div>
                            )}




                            {/* Ratings Progress Bars */}
                            <div className="row mb-3 mt-2">
                                <div className="col-6">
                                    <p className="text-muted small mb-1">Planning</p>
                                    <div className="progress" style={{height: '8px', borderRadius: 0}}>
                                        <div 
                                            className="progress-bar bg-info text-dark" 
                                            role="progressbar"
                                            style={{width: `${review.planningRating * 20}%`}}
                                        >
                                            {review.planningRating}/5
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <p className="text-muted small mb-1">Small Talk</p>
                                    <div className="progress" style={{height: '8px', borderRadius: 0}}>
                                        <div 
                                            className="progress-bar bg-info text-dark" 
                                            role="progressbar"
                                            style={{width: `${review.smallTalkRating * 20}%`}}
                                        >
                                            {review.smallTalkRating}/5
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-6">
                                    <p className="text-muted small mb-1">Safety</p>
                                    <div className="progress" style={{height: '8px', borderRadius: 0}}>
                                        <div 
                                            className="progress-bar bg-info text-dark" 
                                            role="progressbar"
                                            style={{width: `${review.safetyRating * 20}%`}}
                                        >
                                            {review.safetyRating}/5
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <p className="text-muted small mb-1">Connection</p>
                                    <div className="progress" style={{height: '8px', borderRadius: 0}}>
                                        <div 
                                            className="progress-bar bg-info text-dark" 
                                            role="progressbar"
                                            style={{width: `${review.connectionRating * 20}%`}}
                                        >
                                            {review.connectionRating}/5
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <hr className="my-3 border-secondary" />
                            {/* ✅ NEW: Would See Again Indicator */}
                            {review.wouldSeeAgain && (
                            <div>
                            <h6 className="fw-semibold mb-2 gradient-text">Would see again:</h6>
                                <div className="mb-3 p-2">
                                    <p className="text-muted small mb-0">
                                        {review.wouldSeeAgain === 'yes' && "😊 Would see again"}
                                        {review.wouldSeeAgain === 'no' && "😕 Probably not"}
                                        {review.wouldSeeAgain === 'maybe' && "🤷 Maybe..."}
                                    </p>
                                </div>
                            </div>
                            )}
                            {/* Comments Section */}
                            <h6 className="fw-semibold mb-2 gradient-text">💬 Comments</h6>
                            <ul className="list-unstyled small">
                                {review.dateComments && (
                                    <li className="mb-1">{review.dateComments}</li>
                                )}
                                {review.postDateComments && (
                                    <li className="mb-1">{review.postDateComments}</li>
                                )}
                            </ul>

                            {/* Tips Section */}
                            <h6 className="fw-semibold mb-2 gradient-text">📝 Tips</h6>
                            <ul className="list-unstyled small">
                                {review.adviceForOthers && (
                                    <li className="mb-1">{review.adviceForOthers}</li>
                                )}
                                {review.adviceForMaddie && (
                                    <li className="mb-1">{review.adviceForMaddie}</li>
                                )}
                            </ul>

                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReviewList;
