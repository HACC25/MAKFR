const API_KEY = process.env.GEMINI_API_KEY;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(API_KEY);



// Define the expected JSON schema for the response




// Function to generate JSON output based on a prompt
async function generateJsonOutput(prompt, responseSchema) {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite", // Or gemini-1.5-flash
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema, // Use the schema defined above
        },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonOutput = response.text(); // This will be a JSON string
    //console.log('Generated JSON Output:', JSON.parse(jsonOutput));
    return JSON.parse(jsonOutput); // Parse the JSON string into a JavaScript object
}

function uploadUserData() {
    const userPrompt = "Generate a user profile for a random customer a name and email address also random generated";
    generateJsonOutput(userPrompt)
    .then((data) => {
        return data; // Return a new value for the next .then()
    })
    .catch(error => console.error("Error generating JSON:", error));
}

async function geminiTextImage(prompt, image) {
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
        return text;
    } catch (error) {  
        return error;
    }
}


module.exports = { generateJsonOutput, uploadUserData, geminiTextImage };