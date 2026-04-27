const firebaseConfig = {
  apiKey: "YOUR_KEY",
  databaseURL: "YOUR_DB"
};

firebase.initializeApp(firebaseConfig);
export const db = firebase.database();