// DateMe/api/routes/submit.js - PUBLIC REVIEW SUBMISSION ENDPOINT
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load configuration and auth helpers
const configInit = require('../config').initialize;
const { verifyPassword } = require('../middleware/auth');

// Path to the JSON file where reviews will be stored
const REVIEW_FILE_PATH = path.join(__dirname, '..', 'reviews.json');
const SUBMIT_FILE_PATH = path.join(__dirname, '..', 'submissions.json'); // For tracking submissions

/**
 * Helper: Read reviews from file and return as array
 */
function readReviews() {
    try {
        if (!fs.existsSync(REVIEW_FILE_PATH)) {
            console.log('   [READ] Creating empty reviews.json');
            fs.writeFileSync(REVIEW_FILE_PATH, JSON.stringify([], null, 2));
        }
        
        const fileContent = fs.readFileSync(REVIEW_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (err) {
        console.error('   [READ] Failed:', err.message);
        return [];
    }
}

/**
 * Helper: Write reviews to file and return success status
 */
function writeReviews(reviews) {
    try {
        const jsonContent = JSON.stringify(reviews, null, 2);
        fs.writeFileSync(REVIEW_FILE_PATH, jsonContent, 'utf-8');
        
        // Verify write succeeded by reading back
        const verifiedReviews = JSON.parse(fs.readFileSync(REVIEW_FILE_PATH, 'utf-8'));
        return verifiedReviews;
    } catch (err) {
        console.error('   [WRITE] Failed:', err.message);
        throw new Error(`Failed to write reviews.json: ${err.message}`);
    }
}

/**
 * Generate stable ID for review based on content
 */
function generateStableId(review) {
    const idBase = `${review.timestamp}${review.displayName || ''}${review.location || ''}`;
    
    if (review.id && review.id !== 'generate') return review.id;
    
    return crypto.createHash('sha256').update(idBase).digest('hex');
}

// ==================== PUBLIC SUBMISSION ENDPOINT ====================

/**
 * @api {POST} /api/reviews/submit Anonymous review submission (PUBLIC)
 */
router.post('/review', async (req, res) => {
    try {
        console.log('📤 POST /api/reviews/submit requested');
        
        const reviewData = req.body;

        // Validate required fields
        if (!reviewData.location || !reviewData.timestamp) {
            return res.status(400).json({ 
                error: "Missing required fields", 
                details: "Please provide location and timestamp" 
            });
        }

        // Process review data
        let review = { ...reviewData };
        
        // Generate ID if not provided (for anonymous submissions)
        if (!review.id || review.id === 'generate') {
            review.id = generateStableId(review);
        }

        console.log('✅ Review data received and processed');
        console.log(`📊 Current total reviews: ${readReviews().length}`);

        // Load existing reviews
        let currentReviews = readReviews();
        
        // Check for duplicates by timestamp (prevent same submission twice)
        const existingTimestampIndex = currentReviews.findIndex(r => r.timestamp === review.timestamp);
        
        if (existingTimestampIndex !== -1) {
            console.log(`⚠️ Duplicate submission detected (timestamp: ${review.timestamp})`);
            
            // Allow override with different location or rating
            const unique = !currentReviews[existingTimestampIndex].location || 
                          currentReviews[existingTimestampIndex].location !== review.location;
            
            if (!unique) {
                return res.status(400).json({ 
                    error: "Duplicate submission", 
                    message: "You've already submitted a review with this information" 
                });
            }
        }

        // Avoid duplicates by timestamp (if same rating/location combination)
        const hasSameReview = currentReviews.some(r => 
            r.timestamp === review.timestamp &&
            !r.deletedAt &&  // Only check non-deleted reviews
            (!r.id || r.id !== review.id)  // Different ID means different submission
        );

        if (hasSameReview) {
            console.log('⚠️ Duplicate review detected, skipping');
            return res.status(400).json({ 
                error: "Duplicate submission", 
                message: "You've already submitted a review with these details" 
            });
        }

        // Add new review to the list
        currentReviews.push(review);
        
        console.log(`✅ Added review: ${review.displayName || 'Anonymous'}`);
        
        // Persist to file IMMEDIATELY after processing
        const savedReviews = writeReviews(currentReviews);
        
        res.json({
            success: true,
            message: "Review submitted successfully",
            reviewId: review.id,
            totalReviews: savedReviews.length
        });

    } catch (err) {
        console.error('❌ [SUBMIT] Failed to process review submission:', err.message);
        res.status(500).json({ 
            error: "Failed to submit review",
            message: "An error occurred while processing your submission" 
        });
    }
});

module.exports = router;
