const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors'); // Import cors
const multer = require('multer'); // Import multer for file uploads
const fs = require('fs'); // File system module
const AWS = require('aws-sdk'); // Import AWS SDK
require('dotenv').config();

const app = express();

// Enable CORS for requests from http://localhost:5173
app.use(cors({ origin: 'http://localhost:5173' }));

app.use(bodyParser.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Temporary upload directory

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Endpoint to handle AI question answering
app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
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
  console.log('Endpoint /api/solve hit');
  console.log('Request received');
  console.log('File received:', req.file);

  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { path: filePath, originalname } = req.file;

  try {
    // Upload the image to S3
    const fileContent = fs.readFileSync(filePath);
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${originalname}`, // Unique file name
      Body: fileContent,
      ContentType: req.file.mimetype,
    };

    const uploadResult = await s3.upload(params).promise();
    const publicImageUrl = uploadResult.Location;
    console.log('Image uploaded to S3:', publicImageUrl);

    // Send the image URL to OpenAI for processing
    const apiKey = process.env.OPENAI_API_KEY;
    const response = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: "Solve the problems within the image:" },
              {
                type: 'input_image',
                image_url: publicImageUrl,
                detail: 'auto', //Specify detail level (low, high, or auto)
              },
            ],
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
    const solution = response.data.output_text;
    console.log('Solution received:', solution);

    // Delete the local file after processing
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete local file:', err);
    });

    // Send the solution back to the client
    res.json({ solution });
  } catch (error) {
    console.error('Error processing screenshot:', error.response?.data || error.message || error);
    res.status(500).json({ error: 'Failed to process screenshot' });
  }
});

app.listen(3000, () => console.log('API running on port 3000'));