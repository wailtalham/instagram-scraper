const express = require('express');
const mongoose = require('mongoose');
const versionRoutes = require('./routes/versions');
const InstagramApk = require('./models/InstagramApk');
const { fetchInstagramApks } = require('./scrapper/instagramScraper'); 

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Database Connection

/* mongodb://127.0.0.1:27017 */ // Localhost
mongoose.connect('mongodb://mongodb:27017/instagram-scraper')
    .then(() => console.log("Connected to MongoDB..."))
    .catch(err => console.error("Could not connect to MongoDB:", err));

// Scraping Routes
app.post('/start-scrape', async (req, res) => {
    try {
        await fetchInstagramApks();
        res.json({ message: "Scraping completed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error occurred during scraping: " + error.message });    
    }
});

app.use('/api/versions', versionRoutes); // Api Routes

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
