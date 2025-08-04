const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize the Firebase Admin SDK.
admin.initializeApp();
const db = admin.firestore();

/**
 * A v1 callable function that allows a new user to claim a profile.
 * It securely handles finding the profile, updating it, and creating the
 * automatic connection to the person who invited them.
 * This works on the Firebase free tier.
 */
exports.claimProfile = functions.https.onCall(async (data, context) => {
  // 1. Get the data from the app and the new user's ID.
  const { invitationCode } = data;
  const uid = context.auth.uid;
  const email = context.auth.token.email;

  if (!invitationCode) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "An invitation code is required.",
    );
  }

  try {
    // 2. Find the person document with the matching invitation code.
    const q = query(collection(db, "persons"), where("invitationCode", "==", invitationCode.toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new functions.https.HttpsError("not-found", "Invalid invitation code.");
    }
    
    const personDoc = querySnapshot.docs[0];
    const personData = personDoc.data();

    if (personData.claimedByUid) {
      throw new functions.https.HttpsError("already-exists", "This invitation has already been used.");
    }

    // 3. Perform all database updates in a single, safe batch.
    const batch = writeBatch(db);

    // Update the person document
    const personRef = doc(db, "persons", personDoc.id);
    batch.update(personRef, { claimedByUid: uid, email: email }); 

    // Create the user document
    const userRef = doc(db, "users", uid);
    batch.set(userRef, {
      uid: uid,
      email: email,
      displayName: personData.firstName || email,
      personId: personDoc.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create the automatic, accepted connection
    const connectionRef = doc(collection(db, "connections"));
    batch.set(connectionRef, {
        requesterUid: personData.creatorUid,
        recipientUid: uid,
        status: 'accepted',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Commit all changes.
    await batch.commit();

    return { success: true, message: "Profile claimed successfully!" };

  } catch (error) {
    console.error("Error in claimProfile function:", error);
    throw new functions.https.HttpsError("internal", "An error occurred while claiming the profile.");
  }
});
