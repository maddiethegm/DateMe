const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const config = require('./config');
const uploadRoute = require('./routes/upload');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Parse JSON bodies
app.use(bodyParser.json());

// Define route for CSV uploads
app.use('/api', uploadRoute);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
