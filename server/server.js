/**
 * Server.js
 * Main server file for handling job applications and AI reviews.
 * Uses Express.js for routing, Multer for file uploads,
 * and Google Gemini for AI-powered application reviews.
 * Supports DOCX and PDF file types for resumes.
 * Author: Kyle Alexander Baldovi
 * Date: 2024-06-10
 */
// 

const PDFParser = require('pdf-parse'); 
const mammoth = require('mammoth');
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('node:fs/promises');
const cors = require('cors');
const { User, Applicants, Applications, ReviewOutcomes, jobPostings, getData } = require('./config')
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateJsonOutput, uploadUserData, geminiTextImage } = require('./gemini-config');

// Load environment variables
require('dotenv').config(); 
const app = express();
const PORT = 3000;
const API_KEY = process.env.GEMINI_API_KEY;
// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // e.g., '.pdf'
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage: storage });



// // Define a route to send an HTML file

const corsOptions = {
  origin: 'http://localhost:5173', // Your React app's origin
  methods: 'GET,POST,PUT,DELETE', // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

app.use(cors(corsOptions));
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
  res.send({ msg:"You have succesfully signed in" });
});

app.post('/job-posting', async (req, res) => {
  const data = req.body;
  data.forEach( async (job) => {
    await jobPostings.add(job);
  });
  res.send({ msg:"job posting(s) added!!" });
});

// Application submission route from frontend form
// Handles form submission with applicant ID, answers to questions, and file uploads
// Expects form-data with: jobId, applicantId, question1, question2, question3, resume, and jobApplication (both optional)
// Supports DOCX and PDF file types for both resume and job application
app.post('/api/submitApplication', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jobApplication', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log("=== APPLICATION SUBMISSION RECEIVED ===");
    console.log("Body:", req.body);
    console.log("Files received:", req.files ? Object.keys(req.files) : "No files");
    
    const { jobId, applicantId, question1, question2, question3 } = req.body;

    // Validate required fields
    if (!jobId || !applicantId || !question1 || !question2 || !question3) {
      const missingFields = [];
      if (!jobId) missingFields.push('jobId');
      if (!applicantId) missingFields.push('applicantId');
      if (!question1) missingFields.push('question1');
      if (!question2) missingFields.push('question2');
      if (!question3) missingFields.push('question3');
      console.error("Missing required fields:", missingFields);
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    let resumeText = '';
    let jobApplicationText = '';
    
    // Extract text from resume if file was uploaded
    if (req.files && req.files['resume']) {
      try {
        console.log("Processing resume file...");
        const resumeFile = req.files['resume'][0];
        console.log("Resume file details:", { name: resumeFile.originalname, size: resumeFile.size });
        const fileData = await fs.readFile(resumeFile.path);
        resumeText = await extractTextFromBuffer(fileData, path.extname(resumeFile.originalname).toLowerCase());
        console.log("Resume text extracted, length:", resumeText.length);
        
        // Delete the local file after successful processing
        await fs.unlink(resumeFile.path);
        console.log("Resume file deleted from uploads folder");
      } catch (error) {
        console.error("Error extracting text from resume:", error);
        // Delete the file even if extraction fails
        if (req.files['resume']) {
          await fs.unlink(req.files['resume'][0].path).catch(err => console.error("Error deleting resume file:", err));
        }
        return res.status(500).json({ error: 'Failed to extract resume text: ' + error.message });
      }
    } else {
      console.log("No resume file provided");
    }

    // Extract text from job application if file was uploaded
    if (req.files && req.files['jobApplication']) {
      try {
        console.log("Processing job application file...");
        const appFile = req.files['jobApplication'][0];
        console.log("Job application file details:", { name: appFile.originalname, size: appFile.size });
        const fileData = await fs.readFile(appFile.path);
        jobApplicationText = await extractTextFromBuffer(fileData, path.extname(appFile.originalname).toLowerCase());
        console.log("Job application text extracted, length:", jobApplicationText.length);
        
        // Delete the local file after successful processing
        await fs.unlink(appFile.path);
        console.log("Job application file deleted from uploads folder");
      } catch (error) {
        console.error("Error extracting text from job application:", error);
        // Delete the file even if extraction fails
        if (req.files['jobApplication']) {
          await fs.unlink(req.files['jobApplication'][0].path).catch(err => console.error("Error deleting job application file:", err));
        }
        // Don't return error here as job application is optional
        jobApplicationText = '';
      }
    } else {
      console.log("No job application file provided (optional)");
    }

    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 19) + 'Z';

    // Create application object combining form data and both files
    const applicationJson = {
      applicantId: applicantId,
      jobId: jobId,
      submissionDate: formattedTime,
      question1: question1,
      question2: question2,
      question3: question3,
      resumeText: resumeText || 'No resume uploaded',
      jobApplicationText: jobApplicationText || 'No job application uploaded',
      currentStatus: false // Status will be updated when AI review is complete
    };

    console.log("Attempting to save application to database...");
    // Save application to database
    const docRef = await Applications.add(applicationJson);
    console.log("Application successfully saved with ID:", docRef.id);
    console.log("=== APPLICATION SUBMISSION SUCCESSFUL ===");
    
    res.json({ 
      msg: 'Application submitted successfully',
      applicationId: docRef.id 
    });
  } catch (error) {
    console.error("=== ERROR IN APPLICATION SUBMISSION ===");
    console.error("Error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ error: 'Failed to submit application: ' + error.message });
  }
});

// Legacy application submission route (kept for backwards compatibility)
// Handles file upload, text extraction, and saving application data
// Expects 'document' field in form-data for file upload
// and 'applicantId' and 'jobId' in the body
// Supports DOCX and PDF file types
app.post('/applications', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const filePath = req.file.path;
  try {
    const data = await fs.readFile(filePath);
   
    //const pdf = await PDFParser(data);
    
    const rawText = await extractTextFromBuffer(data, path.extname(filePath).toLowerCase()) + "";
      
    // Delete the local file after successful processing
    await fs.unlink(filePath);

    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 19) + 'Z';

    const applicationJson = {
      applicantId: req.body.applicantId,
      jobId:  req.body.jobId ,
      submissionDate: formattedTime,
      resumeText: rawText,
      currentStatus: false
    } 
    await Applications.add(applicationJson);
    
    res.json({ msg: 'Application submitted successfully' });
  } catch (error) {
    console.error("Error extracting text locally:", error);

    // Ensure local file is deleted even if extraction fails
    await fs.unlink(filePath).catch(err => console.error("Error deleting local file:", err));
    
    // Send the error response and RETURN immediately
    return res.status(500).json({ error: 'Failed to extract text' });
  }
});


// Accept POST requests from the Vite proxy at `/api/jobListings`.
// If a `jobId` is provided in the body, return that document.
// Otherwise return all job postings as an array.
app.post('/api/jobListings', async (req, res) => {
  try {
    const jobId = req.body.jobId;
    if (jobId) {
      const doc = await jobPostings.doc(jobId).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      return res.json(doc.data());
    }

    // No jobId provided: return all job postings
    const snapshot = await jobPostings.get();
    const jobs = [];
    snapshot.forEach(d => jobs.push({ id: d.id, ...d.data() }));
    
    return res.json(jobs);
  } catch (err) {
    console.error('Error fetching job listings:', err);
    return res.status(500).json({ error: 'Failed to fetch job listings' });
  }
});

// Reviewer endpoints: list applications, review outcomes, stats, and finalize decisions
app.get('/api/reviewer/applications', async (req, res) => {
  try {
    const snapshot = await Applications.get();
    const apps = [];
    snapshot.forEach(d => apps.push({ id: d.id, ...d.data() }));
    return res.json(apps);
  } catch (err) {
    console.error('Error fetching applications for reviewer:', err);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.get('/api/reviewer/reviews', async (req, res) => {
  try {
    const snapshot = await ReviewOutcomes.get();
    const reviews = [];
    snapshot.forEach(d => reviews.push({ id: d.id, ...d.data() }));
    return res.json(reviews);
  } catch (err) {
    console.error('Error fetching review outcomes for reviewer:', err);
    return res.status(500).json({ error: 'Failed to fetch review outcomes' });
  }
});

// Simple aggregated stats for dashboard
app.get('/api/reviewer/stats', async (req, res) => {
  try {
    const appsSnapshot = await Applications.get();
    const totalApplications = appsSnapshot.size;
    let reviewed = 0;
    const perJobCounts = {};
    appsSnapshot.forEach(d => {
      const data = d.data();
      if (data.currentStatus === true) reviewed++;
      const j = data.jobId || 'unknown';
      perJobCounts[j] = (perJobCounts[j] || 0) + 1;
    });

    const reviewsSnapshot = await ReviewOutcomes.get();
    const decisionCounts = { Qualified: 0, NotQualified: 0, HumanReviewRequested: 0, Other: 0 };
    reviewsSnapshot.forEach(d => {
      const data = d.data();
      const decision = (data.decision || '').toString().toLowerCase();
      if (decision.includes('qualif')) decisionCounts.Qualified++;
      else if (decision.includes('not')) decisionCounts.NotQualified++;
      else if (decision.includes('human')) decisionCounts.HumanReviewRequested++;
      else decisionCounts.Other++;
    });

    return res.json({ totalApplications, reviewed, perJobCounts, decisionCounts });
  } catch (err) {
    console.error('Error computing reviewer stats:', err);
    return res.status(500).json({ error: 'Failed to compute stats' });
  }
});

// Finalize an application decision (mark reviewed/final)
app.put('/api/reviewer/finalize/:applicationId', express.json(), async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const { decision, reviewerId, reasoningLog } = req.body;
    if (!decision || !reviewerId) {
      return res.status(400).json({ error: 'decision and reviewerId are required' });
    }

    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 19) + 'Z';

    // Upsert review outcome
    await ReviewOutcomes.doc(applicationId).set({
      decision,
      reviewType: 'Human',
      reviewTimestamp: formattedTime,
      reviewerId,
      reasoningLog: reasoningLog || '',
      isFinalDecision: true,
      applicantId: (await Applications.doc(applicationId).get()).data()?.applicantId || null,
      jobId: (await Applications.doc(applicationId).get()).data()?.jobId || null
    }, { merge: true });

    // Update application currentStatus to true (reviewed)
    await Applications.doc(applicationId).update({ currentStatus: true });

    return res.json({ msg: 'Application finalized' });
  } catch (err) {
    console.error('Error finalizing application:', err);
    return res.status(500).json({ error: 'Failed to finalize application' });
  }
});

// Function to extract text from DOCX and PDF files
// Takes a buffer and file extension as input
// Returns extracted text as a string
async function extractTextFromBuffer(buffer, fileExtension) {
  // Extract text based on file type
  if (fileExtension === '.docx') {
      const result = await mammoth.extractRawText({ buffer: buffer });
      return result.value.toString();
  } else if (fileExtension === '.pdf') {
      const data = await PDFParser(buffer);
      return data.text;
  } else {
      throw new Error("Unsupported file type. Only DOCX and PDF are supported.");
  }
}

// AI Review Function
// Periodically checks for new applications to review
// and uses Gemini to generate a review decision
// and updates the application status accordingly.
async function reviewAi() {
  // Fetch applications that need review  
  const response = await getData(Applications, 'currentStatus', '==', false);
  const snapshot = await response.get();
  // Iterate through each application needing review
  snapshot.forEach(async (doc) => {
    // Fetch the associated job posting details
    const getJob = await jobPostings.doc(doc.data().jobId).get();
    const applicationsRef = Applications.doc(doc.id);
    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 19) + 'Z';
    // Define the expected response schema for the AI review
    const responseSchema = {
        type: "object",
        properties: {
            applicantId: { type: "string", description: "The unique identifier of the applicant being reviewed." },
            jobId: { type: "string", description: "The unique identifier of the job posting." },
            reviewType: { type: "string", description: "Type of review conducted by AI. either AI_screen or Human" },
            decision: { type: "string", description: "The decision made by the AI reviewer: Qualified, Not Qualified, Human Review Requested " },
            reviewTimestamp: { type: "string", format: "date-time", description: "The timestamp when the review was conducted." },
            reviewerId: { type: "string", description: "The unique identifier of the human reviewer if needed. if ai reviewed set as null" },
            reasoningLog: { type: "string", description: "Detailed reasoning behind the AI's decision." },
            isFinalDecision: { type: "boolean", description: "Indicates if this decision is final or if further review is needed. leave as always false" },
        },
        required: ["reviewType", "decision", "reviewTimestamp", "reviewerId", "reasoningLog", "isFinalDecision"],
    };

    // Construct the prompt for the AI model
    prompt = [];
    prompt.push({ text: "Review the following applicant's application and provide a decision based on the qualifications provided. NOTE: name and any personal information was redacted" });
    prompt.push({ text: JSON.stringify(doc.data()) });
    prompt.push({ text: "Also consider the job posting details: " });
    prompt.push({ text: JSON.stringify(getJob.data()) });
    
    // Generate the AI review using the defined prompt and response schema
    const aiReview = await generateJsonOutput(prompt, responseSchema);
    // Populate additional fields in the AI review
    aiReview.reviewType = "AI_screen";
    aiReview.reviewTimestamp = formattedTime;
    aiReview.reviewerId = null;
    aiReview.applicantId = doc.data().applicantId;
    aiReview.jobId = doc.data().jobId;
    // Save the AI review outcomes and update application status
    await ReviewOutcomes.doc(doc.id).set(aiReview);
    await applicationsRef.update({
      currentStatus:  true
    });
  });
}

//reviewAi();
// Set an interval to run the AI review function every 15 seconds
setInterval(() => {
  console.log("Performing occasional check...");
  reviewAi();
}, 15000);



async function extractTextFromBuffer(buffer, fileExtension) {
    if (fileExtension === '.docx') {
        const result = await mammoth.extractRawText({ buffer: buffer });
        //console.log("Extracted DOCX text:", result.value);
        return result.value.toString();
    } else if (fileExtension === '.pdf') {
        const data = await PDFParser(buffer);
        return data.text;
    } else {
        throw new Error("Unsupported file type. Only DOCX and PDF are supported.");
    }
}







app.post('/api/gemini-text', async (req, res) => {
  const { prompt } = req.body;
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
