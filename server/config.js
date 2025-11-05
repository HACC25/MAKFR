require('dotenv').config(); 
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://makfr-hacc-default-rtdb.firebaseio.com"
});

//const analytics = getAnalytics(firebaseApp);
const db = getFirestore();
const User = db.collection('Users');

module.exports = User;