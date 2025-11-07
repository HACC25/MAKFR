require('dotenv').config(); 
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
try {
    const serviceAccount = require("./makfr-hacc-firebase-adminsdk-fbsvc.json");

    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: "https://makfr-hacc-default-rtdb.firebaseio.com"
    });

    //const analytics = getAnalytics(firebaseApp);
    const db = getFirestore();
    const User = db.collection('Users');
    const Applicants = db.collection('applicants');
    const Applications = db.collection('applications');
    const ReviewOutcomes = db.collection('reviewOutcomes');

    const getData = async ( database, p1, boolean, p2) => {
        const usersData = await database.where(p1, boolean, p2);
        return usersData;
    }

    module.exports = { User, Applicants, Applications, ReviewOutcomes, getData };
} catch (error) {
    console.error("Firebase service account key file is missing. Please provide 'makfr-hacc-firebase-adminsdk-fbsvc.json'.");
    process.exit(1);
}


