importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyD_J84pALN8L2TY_4vTWDLIXraimdR3rME",
  authDomain: "social-commerce-firebase.firebaseapp.com",
  projectId: "social-commerce-firebase",
  storageBucket: "social-commerce-firebase.appspot.com",
  messagingSenderId: "406657732555",
  appId: "1:406657732555:web:8e708dee9f44d01683f04e",
  measurementId: "G-70PEBPSGSJ"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload){
  console.log('Received background message:', payload);
  
})

// messaging.onBackgroundMessage((payload) => {
//   console.log('Received background message:', payload);
//   const notificationTitle = 'Background Message Title';
//   const notificationOptions = {
//     body: 'Background Message body.',
//     icon: '/firebase-logo.png'
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });
