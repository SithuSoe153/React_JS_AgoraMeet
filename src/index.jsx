// App.jsx

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import HostMeeting from './components//HostMeeting';
import JoinMeeting from './components//JoinMeeting';

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
