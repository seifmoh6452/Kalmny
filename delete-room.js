const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDYpYxgVyg8A3Qm5iZp_3qNxYCTECkVYvE",
  authDomain: "kalmny-4f5d4.firebaseapp.com",
  projectId: "kalmny-4f5d4",
  storageBucket: "kalmny-4f5d4.appspot.com",
  messagingSenderId: "1039332549918",
  appId: "1:1039332549918:web:c3f5cf1a1a5f92f2e7e7b7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const roomId = '26dgnN5NyU31au9pMmE6';

async function updateRoom() {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      isActive: false
    });
    console.log('Room deactivated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating room:', error);
    process.exit(1);
  }
}

updateRoom(); 