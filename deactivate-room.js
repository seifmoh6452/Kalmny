const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyDYpYxgVyg8A3Qm5iZp_3qNxYCTECkVYvE",
  authDomain: "kalmny-4f5d4.firebaseapp.com",
  projectId: "kalmny-4f5d4",
  storageBucket: "kalmny-4f5d4.appspot.com",
  messagingSenderId: "1039332549918",
  appId: "1:1039332549918:web:c3f5cf1a1a5f92f2e7e7b7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const roomId = '26dgnN5NyU31au9pMmE6';

async function deactivateRoom() {
  try {
    // First sign in (replace with your email and password)
    await signInWithEmailAndPassword(auth, "your-email@example.com", "your-password");
    
    // Then update the room
    await updateDoc(doc(db, 'rooms', roomId), {
      isActive: false
    });
    console.log('Room deactivated successfully');
  } catch (error) {
    console.error('Error deactivating room:', error);
  } finally {
    // Exit the process when done
    process.exit(0);
  }
}

deactivateRoom(); 