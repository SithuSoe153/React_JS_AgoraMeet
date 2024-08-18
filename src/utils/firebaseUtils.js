import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyD_J84pALN8L2TY_4vTWDLIXraimdR3rME",
  authDomain: "social-commerce-firebase.firebaseapp.com",
  projectId: "social-commerce-firebase",
  storageBucket: "social-commerce-firebase.appspot.com",
  messagingSenderId: "406657732555",
  appId: "1:406657732555:web:8e708dee9f44d01683f04e",
  measurementId: "G-70PEBPSGSJ"
};

const vapikey = "BBnQjrl8du5EIOvFSk38HSmaRD62UM08BfJlnxvI5mDBcO_HHggyYkhv5Zb3ZEjYCFpwT5rvN2Q8XBzK-qNp1H0";

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);

export const requestFCMToken = async () => {
  return Notification.requestPermission()
  .then((permission)=>{
    if(permission === 'granted'){
      return getToken(messaging, {vapikey})
    }
    else{
      throw new Error("Permission denied");
    }
  })
  .catch((error)=>{
    console.error("Error getting FCM token:", error);
    throw error;
  });
};