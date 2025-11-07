const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { User, Applicants, Applications, ReviewOutcomes, getData } = require('./config')
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateJsonOutput, uploadUserData, geminiTextImage } = require('./gemini-config');

// Load environment variables
require('dotenv').config(); 


const app = express();
const PORT = 3000;
const API_KEY = process.env.GEMINI_API_KEY;



// // Define a route to send an HTML file
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



app.post('/create', async (req, res) => {
  const data = req.body;
  await User.add(data);
  res.send({ msg:"User added" });
});

app.post('/applicant', async (req, res) => {
  const data = req.body;
  await Applicants.add(data);
  res.send({ msg:"User added" });
});

app.post('/applications', async (req, res) => {
  const data = req.body;
  await Applications.add(data);
  res.send({ msg:"User added" });
});

app.get('/user', async (req, res) => {
  const email = req.body.email;
  const response = await getData(User, 'email', '==', email);
  //console.log('User data response:', response);
  res.json({ response });
});

async function reviewAi() {
  const response = await getData(Applications, 'currentStatus', '==', false);
  const snapshot = await response.get();
  snapshot.forEach(async (doc) => {
    const applicationsRef = Applications.doc(doc.id);
    const responseSchema = {
        type: "object",
        properties: {
            reviewType: { type: "string", description: "Type of review conducted by AI. either AI_screen or Human" },
            decision: { type: "string", description: "The decision made by the AI reviewer: Qualified, Not Qualified, Human Review Requested " },
            reviewTimestamp: { type: "string", format: "date-time", description: "The timestamp when the review was conducted." },
            reviewerId: { type: "string", description: "The unique identifier of the human reviewer if needed. if ai reviewed set as null" },
            reasoningLog: { type: "string", description: "Detailed reasoning behind the AI's decision." },
            isFinalDecision: { type: "boolean", description: "Indicates if this decision is final or if further review is needed. leave as always false" },
        },
        required: ["reviewType", "decision", "reviewTimestamp", "reviewerId", "reasoningLog", "isFinalDecision"],
    };

    prompt = [];
    prompt.push({ text: "Review the following applicant's application and provide a decision based on the qualifications provided" });
    prompt.push({ text: JSON.stringify(doc.data()) });
    
    const aiReview = await generateJsonOutput(prompt, responseSchema);
    await ReviewOutcomes.add(aiReview);
    await applicationsRef.update({
      currentStatus:  true
    });
    console.log('AI Review:', doc.id);
  });
}

setInterval(() => {
  console.log("Performing occasional check...");
  reviewAi();
}, 15000);











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
  geminiTextImage(prompt, image)
    .then((text) => {
        res.json({ text });
    })
    .catch(error => {
        console.error("Error generating text with image:", error);
        res.status(500).json({ error: "Gemini text-image generation failed" });
    });
});
