const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const cryptoJs = require('crypto-js');

// Load configuration
const config = require('../config');

// Path to the JSON file where reviews will be stored
const REVIEW_FILE = path.join(__dirname, '..', 'reviews.json');

router.post('/upload', (req, res) => {
    const { data } = req.body;

    // Step 1: Decrypt the data using your encryption key
    try {
        const bytes = cryptoJs.enc.Base64.parse(data);
        const decrypted = cryptoJs.AES.decrypt(bytes, config.encryptionKey);
        const decryptedData = JSON.parse(decrypted.toString(cryptoJs.enc.Utf8));

        console.log("✅ Decrypted data:", decryptedData);

    } catch (err) {
        return res.status(400).json({ error: "Decryption failed" });
    }

    // Step 2: Load existing reviews from file
    let reviews = [];
    try {
        if (fs.existsSync(REVIEW_FILE)) {
            const data = fs.readFileSync(REVIEW_FILE, 'utf-8');
            reviews = JSON.parse(data);
        }
    } catch (err) {
        console.error("❌ Error loading reviews:", err.message);
        return res.status(500).json({ error: "Failed to load existing reviews" });
    }

    // Step 3: Process new reviews
    const processedReviews = [];

    for (const review of decryptedData) {
        // Check if this review already exists (by timestamp)
        const existingReview = reviews.find(r => r.timestamp === review.timestamp);
        if (!existingReview) {
            processedReviews.push(review);
        }
    }

    // Step 4: Add new reviews to the list
    reviews = [...reviews, ...processedReviews];

    // Step 5: Save updated reviews to file
    try {
        fs.writeFileSync(REVIEW_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
        console.log("✅ Reviews saved successfully.");
    } catch (err) {
        console.error("❌ Error saving reviews:", err.message);
        return res.status(500).json({ error: "Failed to save reviews" });
    }

    // Step 6: Return a success response
    res.json({
        message: "✅ Reviews processed and saved successfully",
        newReviewsCount: processedReviews.length,
        totalReviews: reviews.length
    });
});

module.exports = router;
