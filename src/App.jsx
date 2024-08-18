// App.jsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import HostMeeting from './components//HostMeeting';
import JoinMeeting from './components//JoinMeeting';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    }).catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/host" element={<HostMeeting />} />
        <Route path="/join" element={<JoinMeeting />} />
      </Routes>
    </Router>
  );
}

export default App;
