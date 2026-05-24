// DateMe/api/middleware/auth.js - AUTHENTICATION MODULE
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // ← IMPORT BCryptJS

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key'; // Change this in .env!

/**
 * Hash a password (for creating new admins)
 * @param {string} password - Plain text password
 * @param {number} saltRounds - Number of bcrypt rounds (default: 10)
 * @returns {Promise<string>} - Bcrypt hash string
 */
exports.hashPassword = async (password, saltRounds = 10) => {
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;
    } catch (err) {
        console.error('❌ [AUTH] Password hashing failed:', err.message);
        throw new Error('Failed to hash password');
    }
};

/**
 * Verify a password against a stored bcrypt hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} - True if match, false otherwise
 */
exports.verifyPassword = async (password, hash) => {
    try {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    } catch (err) {
        console.error('❌ [AUTH] Password verification failed:', err.message);
        throw new Error('Password verification error');
    }
};

/**
 * Generate JWT token for authenticated user
 * @param {object} user - User object with username, role, etc.
 * @param {object} options - Options including expiry
 * @returns {string} - JWT token string
 */
exports.generateToken = (user, options = {}) => {
    const payload = {
        id: user.id || user.username,
        username: user.username,
        role: user.role,
        email: null // Optional field
    };
    
    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: options.expiresIn || '24h' 
    });
};

/**
 * Verify token on protected routes (Express middleware)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {object} next - Next middleware function
 */
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization']?.split(' ')?.[1];
    
    if (!authHeader) {
        return res.status(401).json({ 
            error: "Missing Authorization header" 
        });
    }

    try {
        jwt.verify(authHeader, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(403).json({ 
            error: "Invalid or expired token",
            message: err.message === 'jwt expired' ? 'Session expired. Please login again.' : err.message
        });
    }
};

/**
 * Extract and decode token from Authorization header (for getting user info)
 */
exports.extractToken = (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        jwt.decode(token, JWT_SECRET);
        return { success: true, token };
    } catch (err) {
        return res.status(403).json({ error: "Invalid token" });
    }
};
