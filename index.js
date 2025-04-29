require('dotenv').config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();

app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// In-memory storage (this will reset each time the server restarts)
let urlDatabase = {};
let idCounter = 1;

// Helper function to generate a short code (Base62)
function generateShortCode(url) {
  // Create a hash of the URL (MD5, for simplicity)
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 6);
  return hash;
}

// API endpoint to handle POST requests for shortening URLs
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Check if the URL is valid
  dns.lookup(new URL(originalUrl).hostname, (err, address, family) => {
    if (err) {
      return res.json({ error: 'Invalid URL' });
    }

    // Generate a unique short code for the URL
    const shortCode = generateShortCode(originalUrl);

    // Store the mapping in the database (in-memory)
    urlDatabase[shortCode] = originalUrl;

    // Respond with the shortened URL
    res.json({
      original_url: originalUrl,
      short_url: shortCode
    });
  });
});

app.get("/api/shorturl/:shortcode", (req, res) => {
  const shortCode = req.params.shortcode;

  // Look up the original URL from the database
  const originalUrl = urlDatabase[shortCode];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: "Short URL not found" });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
