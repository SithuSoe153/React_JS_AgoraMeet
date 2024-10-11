import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Lobby from "./pages/Lobby";
import Room from "./pages/Room";
import Recording from "./pages/Recording";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/room" element={<Room />} />
        <Route path="/recording" element={<Recording />} />
      </Routes>
    </Router>
  );
};

export default App;
