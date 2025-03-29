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

  console.log('Endpoint /api/solve hit'); // Add this log
  console.log('Request received'); // Debugging log
  console.log('File received:', req.file); // Debugging log

  if (!req.file) {
    console.log('No file uploaded'); // Debugging log
    return res.status(400).json({ error: 'No file uploaded' });
  }


  const { path: filePath } = req.file;

  try {
    // Read the uploaded image and convert it to Base64
    const base64Image = fs.readFileSync(filePath, 'base64');
    console.log('Base64 image generated'); // Debugging log

    // Send the image to OpenAI for processing
    const apiKey = process.env.OPENAI_API_KEY;
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Solve the questions in this image.',
          },
          {
            role: 'user',
            content: `data:image/jpeg;base64,${base64Image}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract the response text
    const solution = response.data.choices[0].message.content;

    // Optionally delete the file after processing
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete file:', err);
    });

    // Send the solution back to the client
    res.json({ solution });
  } catch (error) {
    console.error('Error processing screenshot:', error.response?.data || error.message || error);
    res.status(500).json({ error: 'Failed to process screenshot' });
  }
});

app.listen(3000, () => console.log('API running on port 3000'));