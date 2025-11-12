/**
 * gemini-config.js
 * Configuration and helper functions for Google Gemini AI integration.
 * 
 * Provides functions to generate JSON output based on prompts,
 * upload user data, and handle text and image generation.     
 *     
 * Author: Kyle Alexander Baldovi
 * Date: 2024-06-10
 * 
 */

// Load environment variables
require('dotenv').config(); 
const API_KEY = process.env.GEMINI_API_KEY;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(API_KEY);


// Function to generate JSON output based on a prompt and response schema
// Returns a JavaScript object parsed from the JSON string
async function generateJsonOutput(prompt, responseSchema) {
    // Initialize the Gemini generative model with the specified schema
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite", // Or gemini-1.5-flash
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema, // Use the schema defined above
        },
    });

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonOutput = response.text(); // This will be a JSON string
    return JSON.parse(jsonOutput); // Parse the JSON string into a JavaScript object
}

async function geminiTextImage(prompt, image) {
    try {
        // Initialize Gemini Generative AI
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        // Prepare content parts
        const parts = [];
        if (prompt) {
            // Add text part
            parts.push({ text: prompt });
        }

        if (image) {
            // Remove the data URL prefix to get the base64-encoded string
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            // Add image part
            parts.push({
                inlineData: {
                    mimeType: "image/jpeg", // or "image/png" depending on your input
                    data: base64Data,
                },
            });
        }
        // Generate content with both text and image parts
        const result = await model.generateContent({
            contents: [{ role: "user", parts }],
        });
        // Extract and return the text response
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {  
        // Handle errors appropriately
        console.error("Error generating text and image with Gemini:", error);
        return error;
    }
}

module.exports = { generateJsonOutput, uploadUserData, geminiTextImage };