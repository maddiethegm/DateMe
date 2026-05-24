// DateMe/api/routes/upload.js
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

    // Log incoming request payload
    console.log("🚀 [API] Received POST request to /upload");
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
    console.log(`🔑 Using API config: ${JSON.stringify(config)}`);

    // Step 1: Process data based on encryption setting
    let decryptedData;
    if (config.ENABLE_ENCRYPTION) {
        console.log("🔒 Encryption is enabled — attempting decryption");

        try {
            const bytes = cryptoJs.enc.Base64.parse(data);
            const decrypted = cryptoJs.AES.decrypt(bytes, config.encryptionKey);
            decryptedData = JSON.parse(decrypted.toString(cryptoJs.enc.Utf8));
            console.log("✅ Decrypted data successfully:", decryptedData);
        } catch (err) {
            console.error("❌ [DECRYPTION FAILED] Error decrypting payload:", err.message);
            return res.status(400).json({ error: "Decryption failed" });
        }
    } else {
        console.log("🔐 Encryption is disabled — parsing raw JSON");
        try {
            decryptedData = JSON.parse(data);
            console.log("✅ Raw data parsed successfully:", decryptedData);
        } catch (err) {
            console.error("❌ [JSON PARSE FAILED] Error parsing incoming payload:", err.message);
            return res.status(400).json({ error: "Invalid JSON format" });
        }
    }

    // Step 2: Load existing reviews from file
    let reviews = [];
    try {
        if (fs.existsSync(REVIEW_FILE)) {
            const data = fs.readFileSync(REVIEW_FILE, 'utf-8');
            reviews = JSON.parse(data);
            console.log("✅ Retrieved", reviews.length, "existing reviews");
        }
    } catch (err) {
        console.error("❌ [LOAD FAILED] Error loading existing reviews:", err.message);
        return res.status(500).json({ error: "Failed to load existing reviews" });
    }

    // Step 3: Process new reviews
    const processedReviews = [];

    for (const review of decryptedData) {
        console.log("🔍 Processing review:", JSON.stringify(review, null, 2));
        const existingReview = reviews.find(r => r.timestamp === review.timestamp);
        if (!existingReview) {
            console.log("🆕 New review found — adding to list");
            processedReviews.push(review);
        } else {
            console.log("🔄 Review already exists — skipping");
        }
    }

    // Step 4: Add new reviews to the list
    reviews = [...reviews, ...processedReviews];
    console.log("🧮 Merged", processedReviews.length, "new reviews into total of", reviews.length);

    // Step 5: Save updated reviews to file
    try {
        fs.writeFileSync(REVIEW_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
        console.log("✅ Reviews saved successfully.");
    } catch (err) {
        console.error("❌ [SAVE FAILED] Error saving reviews:", err.message);
        return res.status(500).json({ error: "Failed to save reviews" });
    }

    // Step 6: Return a success response
    res.json({
        message: "✅ Reviews processed and saved successfully",
        newReviewsCount: processedReviews.length,
        totalReviews: reviews.length
    });

    console.log("🔚 [END] Upload completed successfully");
});

module.exports = router;
