/************************************Setup Firebase Admin SDK****************************************/
const adminSDK = require("firebase-admin");
require("dotenv").config();

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
adminSDK.initializeApp({
    credential: adminSDK.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET_URL,
    databaseURL: process.env.FIREBASE_DB_URL,
});

//Get user database once rn just to make sure it isn't called repetitively and prevent exceeding quotas
const firebaseDB = adminSDK.firestore();

module.exports = { adminSDK, firebaseDB };