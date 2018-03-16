import * as firebase from 'firebase'

const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_NAME,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: "",
  messagingSenderId: process.env.REACT_APP_SENDER_ID
}

export const firebaseApp = firebase.initializeApp(config)
export const messaging = firebase.messaging()