const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK.
admin.initializeApp();
const db = admin.firestore();

/**
 * The "Relationship Engine". A v1 callable function that works on the free plan.
 * It adds a new person and automatically creates the two-way relationship link.
 */
exports.addRelationship = functions.https.onCall(async (data, context) => {
  // 1. Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in to add a relationship.",
    );
  }

  // 2. Get the data sent from the app.
  const {existingPersonId, relationshipType, newPersonData} = data;
  const uid = context.auth.uid;

  // 3. Validate the incoming data.
  if (!existingPersonId || !relationshipType || !newPersonData) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing data for relationship creation.",
    );
  }

  try {
    // 4. Generate a unique, random invitation code.
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 5. Create the new person's document in the 'persons' collection.
    const newPersonRef = await db.collection("persons").add({
      ...newPersonData,
      creatorUid: uid,
      claimedByUid: null,
      invitationCode: code,
      parents: [],
      children: [],
      spouse: null,
    });

    // 6. Update both documents in a transaction.
    await db.runTransaction(async (transaction) => {
      const existingPersonRef = db.collection("persons").doc(existingPersonId);
      const newPersonDocRef = db.collection("persons").doc(newPersonRef.id);

      if (relationshipType === "father" || relationshipType === "mother") {
        transaction.update(existingPersonRef, {
          parents: admin.firestore.FieldValue.arrayUnion(newPersonRef.id),
        });
        transaction.update(newPersonDocRef, {
          children: admin.firestore.FieldValue.arrayUnion(existingPersonId),
        });
      } else if (relationshipType === "child") {
        transaction.update(existingPersonRef, {
          children: admin.firestore.FieldValue.arrayUnion(newPersonRef.id),
        });
        transaction.update(newPersonDocRef, {
          parents: admin.firestore.FieldValue.arrayUnion(existingPersonId),
        });
      } else if (relationshipType === "spouse") {
        transaction.update(existingPersonRef, {spouse: newPersonRef.id});
        transaction.update(newPersonDocRef, {spouse: existingPersonId});
      }
    });

    return {success: true, newPersonId: newPersonRef.id};
  } catch (error) {
    console.error("Error in addRelationship function:", error);
    throw new functions.https.HttpsError(
        "internal",
        "An error occurred while creating the relationship.",
    );
  }
});
