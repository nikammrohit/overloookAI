const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors'); // Import cors
const multer = require('multer'); // Import multer for file uploads
const fs = require('fs'); // File system module
require('dotenv').config();

const app = express();

// Enable CORS for requests from http://localhost:5173
app.use(cors({ origin: 'http://localhost:5173' }));

app.use(bodyParser.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Temporary upload directory

// Endpoint to handle AI question answering
app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: question }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ answer: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get a response' });
  }
});

// Endpoint to handle screenshot uploads and process them
app.post('/api/solve', upload.single('screenshot'), async (req, res) => {
  const { path: filePath } = req.file;

  try {
    // Simulate processing the screenshot (e.g., OCR or AI-based analysis)
    const solution = `Processed screenshot at ${filePath}`;

    // Optionally delete the file after processing
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete file:', err);
    });

    res.json({ solution });
  } catch (error) {
    console.error('Error processing screenshot:', error);
    res.status(500).json({ error: 'Failed to process screenshot' });
  }
});

app.listen(3000, () => console.log('API running on port 3000'));