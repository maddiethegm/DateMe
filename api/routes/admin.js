// DateMe/api/routes/admin.js - ROUTES WITH PROPER AUTH IMPORTS
const express = require('express');
const router = express.Router();
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// ✅ CORRECT: Import auth module at top with all needed functions
const { verifyToken, generateToken } = require('../middleware/auth'); // ← FIXED IMPORT
const configInit = require('../config').initialize; // Config loader (for routes that need it)

/**
 * Helper: Read reviews from file and return as array
 */
function readReviews() {
    try {
        const REVIEW_FILE_PATH = path.join(__dirname, '..', 'reviews.json');
        
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
        fs.writeFileSync(path.join(__dirname, '..', 'reviews.json'), jsonContent, 'utf-8');
        console.log(`   [WRITE] Successfully wrote ${jsonContent.length} bytes to reviews.json`);
        
        // Verify write succeeded by reading back
        const verifiedReviews = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'reviews.json'), 'utf-8'));
        return verifiedReviews;
    } catch (err) {
        console.error('   [WRITE] Failed:', err.message);
        throw new Error(`Failed to write reviews.json: ${err.message}`);
    }
}

/**
 * Helper: Generate stable ID for review based on content
 */
function generateStableId(review) {
    const idBase = `${review.timestamp}${review.displayName || ''}${review.location || ''}`;
    
    if (review.id && review.id !== 'generate') return review.id;
    
    return crypto.createHash('sha256').update(idBase).digest('hex');
}

/**
 * Helper: Find and update review by ID in file
 */
function findAndUpdateReview(targetId, updates) {
    const reviews = readReviews();
    
    let updated = false;
    for (let i = 0; i < reviews.length; i++) {
        const review = reviews[i];
        
        if (!review.id) {
            review.id = generateStableId(review);
        }
        
        if (review.id === targetId || review.timestamp === targetId) {
            console.log(`   [UPDATE] Found and updating review at index ${i}: ${review.displayName || 'Anonymous'}`);
            
            // Apply updates
            Object.assign(review, updates);
            updated = true;
            
            // Save back to file immediately after each update
            const savedReviews = writeReviews(reviews);
            
            return { success: true, review: savedReviews[i], reviews: savedReviews };
        }
    }
    
    console.log(`   [UPDATE] Review ${targetId} not found`);
    return { success: false, error: 'Review not found' };
}

/**
 * Helper: Soft delete a review by ID (mark as hidden)
 */
function softDeleteReview(id) {
    const reviews = readReviews();
    
    let updated = false;
    for (let i = 0; i < reviews.length; i++) {
        const review = reviews[i];
        
        if (!review.id) {
            review.id = generateStableId(review);
        }
        
        if (review.id === id || review.timestamp === id) {
            console.log(`   [DELETE] Soft deleting review at index ${i}: ${review.displayName || 'Anonymous'}`);
            
            review.hidden = true;
            review.deletedAt = new Date().toISOString();
            updated = true;
            
            // Save back to file immediately after each update
            const savedReviews = writeReviews(reviews);
            
            return { success: true, review: savedReviews[i], reviews: savedReviews };
        }
    }
    
    console.log(`   [DELETE] Review ${id} not found`);
    return { success: false, error: 'Review not found' };
}

/**
 * Helper: Generate JWT token for authenticated user (same as auth module)
 */
function generateTokenForUser(user) {
    const payload = {
        id: user.id || user.username,
        username: user.username,
        role: user.role,
        email: null
    };
    
    return require('../middleware/auth').generateToken(payload);
}

// ==================== AUTHENTICATION ENDPOINTS ====================

/**
 * @api {POST} /api/admin/login Login with username + password, receive JWT token (BCRYPT)
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            console.log('❌ [AUTH] Missing credentials');
            return res.status(400).json({ 
                error: "Missing username or password",
                details: "Please provide both fields" 
            });
        }

        // Normalize username (reference implementation pattern)
        const normalizedUsername = username.toLowerCase();
        
        // Get full config to access admin list
        const fullConfig = require('../config').getFullConfig();
        
        if (!fullConfig || !fullConfig.accessControl?.admins) {
            return res.status(500).json({ error: "Admin configuration not found" });
        }

        // Find admin by username in config
        const admins = fullConfig.accessControl.admins;
        
        for (const admin of admins) {
            if (admin.username === normalizedUsername && admin.status === 'active') {
                // ✅ VERIFY PASSWORD USING BCRYPT.compare (Reference Implementation Pattern)
                const isPasswordMatch = await require('../middleware/auth').verifyPassword(password, admin.passwordHash);
                
                if (!isPasswordMatch) {
                    console.log(`❌ [AUTH] Password mismatch for user "${username}"`);
                    return res.status(401).json({ 
                        error: "Invalid credentials", 
                        message: "Password is incorrect" 
                    });
                }

                // ✅ Generate JWT token (like reference implementation)
                const token = generateTokenForUser(admin);

                console.log(`✅ [AUTH] Login successful for user "${admin.username}"`);
                
                return res.json({
                    success: true,
                    message: "Login successful",
                    username: admin.username,
                    displayName: admin.displayName,
                    role: admin.role,
                    expiresIn: '24h'
                });
            }
        }

        // User not found after checking all admins
        console.log(`❌ [AUTH] User "${username}" not found`);
        return res.status(401).json({ 
            error: "Invalid credentials", 
            message: "Username or password is incorrect" 
        });

    } catch (err) {
        console.error('❌ [AUTH] Login failed:', err.message);
        res.status(500).json({ error: "Login failed. Please check your credentials." });
    }
});

/**
 * @api {GET} /api/admin/me Get current user info (protected endpoint)
 */
router.get('/me', verifyToken, (req, res) => {
    try {
        // Decode token to get user info
        const auth = require('../middleware/auth');
        const decoded = auth.extractToken(req, res);
        
        if (!decoded.success || !decoded.decoded) {
            return res.status(403).json({ error: "Invalid token" });
        }

        return res.json({
            username: decoded.decoded.username,
            role: decoded.decoded.role
        });

    } catch (err) {
        console.error('❌ [AUTH] Get user info failed:', err.message);
        res.status(500).json({ error: "Failed to get user info" });
    }
});

// ==================== ADMIN ENDPOINTS ====================

/**
 * @api {GET} /api/admin/reviews Get all reviews for admin management
 */
router.get('/reviews', (req, res) => {
    try {
        console.log('🔍 GET /api/admin/reviews');
        
        const reviews = readReviews();
        
        // Generate IDs if missing
        for (const review of reviews) {
            if (!review.id) {
                review.id = crypto.createHash('sha256').update(review.timestamp + (review.displayName || '')).digest('hex');
            }
        }
        
        res.json({
            success: true,
            reviews: reviews,
            total: reviews.length,
            hiddenCount: reviews.filter(r => r.hidden || r.deletedAt).length
        });

    } catch (err) {
        console.error('❌ [ADMIN] GET /reviews failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

/**
 * @api {PUT} /api/admin/reviews/:id Update a specific review (hide, feature, comment)
 */
router.put('/reviews/:id', async (req, res) => {
    try {
        console.log(`🔧 PUT /api/admin/reviews/${req.params.id}`);
        
        // Check if user is authenticated (basic check for now, full auth in middleware would be better)
        const headers = req.headers;
        const hasAuthHeader = headers['authorization'] && headers['authorization'].startsWith('Bearer ');
        
        if (!hasAuthHeader) {
            return res.status(401).json({ error: "Not authenticated. Please login first." });
        }

        const result = findAndUpdateReview(req.params.id, req.body || {});
        
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }
        
        console.log(`   [RESULT] Review ${result.review.id} updated successfully`);
        res.json(result);

    } catch (err) {
        console.error('❌ [ADMIN] PUT /reviews/:id failed:', err.message);
        res.status(500).json({ error: `Failed to update review: ${err.message}` });
    }
});

/**
 * @api {DELETE} /api/admin/reviews/:id Soft delete (hide) a review
 */
router.delete('/reviews/:id', async (req, res) => {
    try {
        console.log(`🗑️ DELETE /api/admin/reviews/${req.params.id}`);
        
        // Check authentication
        const headers = req.headers;
        const hasAuthHeader = headers['authorization'] && headers['authorization'].startsWith('Bearer ');
        
        if (!hasAuthHeader) {
            return res.status(401).json({ error: "Not authenticated. Please login first." });
        }

        const result = softDeleteReview(req.params.id);
        
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }
        
        console.log(`   [RESULT] Review ${result.review.id} soft deleted successfully`);
        res.json(result);

    } catch (err) {
        console.error('❌ [ADMIN] DELETE /reviews/:id failed:', err.message);
        res.status(500).json({ error: `Failed to delete review: ${err.message}` });
    }
});

/**
 * @api {POST} /api/admin/reviews/upload Upload new reviews from admin interface
 */
router.post('/reviews/upload', async (req, res) => {
    try {
        console.log('📤 POST /api/admin/reviews/upload');
        
        // Check authentication
        const headers = req.headers;
        const hasAuthHeader = headers['authorization'] && headers['authorization'].startsWith('Bearer ');
        
        if (!hasAuthHeader) {
            return res.status(401).json({ error: "Not authenticated. Please login first." });
        }

        const newReviewsRaw = req.body.reviews || [];
        console.log(`   [UPLOAD] Received ${newReviewsRaw.length} new reviews`);
        
        let currentReviews = readReviews();
        
        // Process each new review with proper ID generation
        for (const rawReview of newReviewsRaw) {
            let review = { ...rawReview }; // Deep copy
            
            // Generate stable ID if missing
            if (!review.id) {
                review.id = crypto.createHash('sha256').update(review.timestamp + (review.displayName || '')).digest('hex');
            }
            
            // Add default metadata for new submissions
            review.createdAt = new Date().toISOString();
            review.updatedAt = new Date().toISOString();
            review.hidden = false;
            review.featured = false;
            review.adminComment = "";
            review.status = "new"; // Track as in-app submission
            
            console.log(`   [UPLOAD] Adding: ${review.displayName || 'Anonymous'} - Rating: ${review.overallRating}`);
            
            // Avoid duplicates by timestamp
            const existingIndex = currentReviews.findIndex(r => r.timestamp === review.timestamp);
            if (existingIndex === -1) {
                currentReviews.push(review);
            } else {
                console.log(`   [UPLOAD] Skipping duplicate: ${review.timestamp}`);
            }
        }
        
        // Persist to file IMMEDIATELY after processing
        const savedReviews = writeReviews(currentReviews);
        
        res.json({
            success: true,
            message: `Successfully uploaded ${newReviewsRaw.length} new reviews`,
            totalReviews: savedReviews.length
        });

    } catch (err) {
        console.error('❌ [ADMIN] POST /reviews/upload failed:', err.message);
        res.status(500).json({ error: `Failed to upload reviews: ${err.message}` });
    }
});

/**
 * @api {GET} /api/admin/reviews/hidden Get hidden/deleted reviews only
 */
router.get('/reviews/hidden', (req, res) => {
    try {
        console.log('👁️ GET /api/admin/reviews/hidden');
        
        const reviews = readReviews();
        const hiddenReviews = reviews.filter(r => r.hidden || r.deletedAt);
        
        res.json({
            success: true,
            hiddenReviews: hiddenReviews,
            count: hiddenReviews.length
        });

    } catch (err) {
        console.error('❌ [ADMIN] GET /reviews/hidden failed:', err.message);
        res.status(500).json({ error: 'Failed to fetch hidden reviews' });
    }
});

module.exports = router;
