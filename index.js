require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// In-memory storage (this will reset each time the server restarts)
let urlDatabase = {};
let idCounter = 1;

// Helper function to validate URL format
function isValidUrl(url) {
  const regex = /^(http:\/\/|https:\/\/)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+/;
  return regex.test(url);
}

// Helper function to generate a short code (MD5 hash, for simplicity)
function generateShortCode(url) {
  const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 6);
  return hash;
}

// API endpoint to handle POST requests for shortening URLs
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Validate the URL format first
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: "invalid url" });
  }

  // Check if the URL is valid by doing a DNS lookup
  dns.lookup(new URL(originalUrl).hostname, (err, address, family) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    // Generate a unique short code for the URL
    const shortCode = generateShortCode(originalUrl);

    // Store the mapping in the database (in-memory)
    urlDatabase[shortCode] = originalUrl;

    // Respond with the shortened URL
    res.json({
      original_url: originalUrl,
      short_url: shortCode,
    });
  });
});

// Redirect to the original URL when visiting a short URL
app.get("/api/shorturl/:shortcode", (req, res) => {
  const shortCode = req.params.shortcode;

  // Look up the original URL from the database
  const originalUrl = urlDatabase[shortCode];

  if (originalUrl) {
    // Redirect to the original URL
    return res.redirect(originalUrl);
  } else {
    // If no URL is found for the shortcode, return an error
    return res.json({ error: "Short URL not found" });
  }
});

// Start the server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
