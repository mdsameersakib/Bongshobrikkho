const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK.
admin.initializeApp();

/**
 * Creates a user document in Firestore when a new user signs up.
 */
exports.createUserDocument = functions.auth.user().onCreate((user) => {
  const {uid, email, displayName} = user;
  const db = admin.firestore();

  const userDocRef = db.collection("users").doc(uid);

  return userDocRef.set({
    uid: uid,
    email: email,
    displayName: displayName || email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }).then(() => {
    console.log(`Successfully created user document for UID: ${uid}`);
    return null;
  }).catch((error) => {
    console.error(`Error creating user document for UID: ${uid}`, error);
    throw new functions.https.HttpsError(
        "internal",
        "Could not create user document.",
    );
  });
});
