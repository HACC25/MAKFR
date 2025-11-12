/**
 * Firebase configuration and initialization
 * Make sure to have the Firebase service account key file
 * named 'makfr-hacc-firebase-adminsdk-fbsvc.json' in the server directory.
 * Author: Kyle Alexander Baldovi
 * Date: 2024-06-10
 */

// Load environment variables
require('dotenv').config(); 
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
try {
    // Initialize Firebase
    const serviceAccount = require("./makfr-hacc-firebase-adminsdk-fbsvc.json"); // Ensure this file exists
    // Initialize Firebase app
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: "https://makfr-hacc-default-rtdb.firebaseio.com"
    });

    // Initialize Firestore database
    // Export collections
    const db = getFirestore();
    const User = db.collection('Users');
    const Applicants = db.collection('applicants');
    const Applications = db.collection('applications');
    const ReviewOutcomes = db.collection('reviewOutcomes');
    const jobPostings = db.collection('jobPostings');

    // Generic function to get data from a collection with filters
    // p1: field name, boolean: operator, p2: value
    // Example: getData(User, 'age', '>=', 18)
    // Returns an array of documents matching the filter
    const getData = async ( database, p1, boolean, p2) => {
        // Create a query with the specified filter
        const usersData = await database.where(p1, boolean, p2);
        return usersData;
    }
    // Export the collections and getData function
    module.exports = { User, Applicants, Applications, ReviewOutcomes, jobPostings, getData };
} catch (error) {
    // Handle the error if the service account file is missing
    console.error("Firebase service account key file is missing. Please provide 'makfr-hacc-firebase-adminsdk-fbsvc.json'."); // Contact @altronxs aka Kyle Baldovi for access.
    process.exit(1);
}


