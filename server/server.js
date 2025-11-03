const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
require('dotenv').config(); 

const app = express();
const PORT = 3000;
const API_KEY = process.env.GEMINI_API_KEY;

// Serve static files from a 'public' directory (optional, but good practice)
//app.use(express.static(path.join(__dirname, 'public')));

// Define a route to send an HTML file
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.post('/api/gemini-text', async (req, res) => {
  const { prompt } = req.body;
  console.log('Received body:', req.body);
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ text });
  } catch (error) {  
    console.error(error);
    res.status(500).json({ error: "Gemini text generation failed" });
  }
});

app.post('/api/gemini-text-image', async (req, res) => {
  const { prompt, image } = req.body;
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const parts = [];
    if (prompt) {
      parts.push({ text: prompt });
    }

    if (image) {
      // Strip base64 prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

      parts.push({
        inlineData: {
          mimeType: "image/jpeg", // or "image/png" depending on your input
          data: base64Data,
        },
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const response = await result.response;
    const text = response.text();
    res.json({ text });
  } catch (error) {  
    console.error(error);
    res.status(500).json({ error: "Gemini text generation failed" });
  }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});




//AI FUNCTION (Text ONLY input)
async function runGemini(req) {
    const prompt = req.body;
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); // Or other models like "gemini-1.5-flash"

    //const prompt = "Write a short story about a cat exploring a new house.";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
}
const questions = { body: "what is pi?"};
runGemini(questions);

//AI FUNCTION (Text and image input))
async function generateContentWithImageAndText() {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); // Or other models like "gemini-1.5-flash"


    const imagePath = path.join(__dirname, 'public', 'branding', 'kuleanaCompassLogo.png');
    const base64ImageFile = fs.readFileSync(imagePath, { encoding: "base64" });

    const contents = [
    {
        inlineData: {
        mimeType: "image/png", // Or "image/png", etc., based on your image type
        data: base64ImageFile,
        },
    },
    { text: "Describe this image and provide a creative caption for it." },
    ];

    const result = await model.generateContent(contents);
    const response = await result.response;
    const text = response.text();
    console.log(text);
}
