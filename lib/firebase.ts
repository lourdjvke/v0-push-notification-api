import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove, query, orderByChild, limitToLast } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDkIGFjmEpUIyENed5Zx7GG3krQFV2U5aE",
  authDomain: "insafe-ng.firebaseapp.com",
  databaseURL: "https://insafe-ng-default-rtdb.firebaseio.com",
  projectId: "insafe-ng",
  storageBucket: "insafe-ng.firebasestorage.app",
  messagingSenderId: "219620010651",
  appId: "1:219620010651:web:cf59b5f604338a52f2b43e",
  measurementId: "G-RWVWN0K8JH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database, ref, set, get, remove, query, orderByChild, limitToLast };
