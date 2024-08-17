// src/App.jsx
import React, { useState } from "react";
import Login from "./components/Login";
import { Button, Typography } from "@mui/material";

const App = () => {
  const [hostInfo, setHostInfo] = useState(null);
  const [copySuccess, setCopySuccess] = useState("");
  
  const handleLogin = (info) => {
    setHostInfo(info);
  };

  const copyToClipboard = () => {
    const link = `http://localhost:5173/join/${hostInfo.channelName}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopySuccess("Link copied to clipboard!");
      })
      .catch((err) => {
        setCopySuccess("Failed to copy link");
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      {!hostInfo ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div>
          <Typography variant="h5">Welcome, {hostInfo.username}</Typography>
          <Typography variant="body1">
            Channel Name: {hostInfo.channelName}
          </Typography>
          <Typography variant="body2" style={{ marginTop: "10px" }}>
            Share this link to join:
          </Typography>
          <Typography
            variant="body1"
            style={{ fontWeight: "bold", marginBottom: "10px" }}
          >
            {`http://localhost:5173/join/${hostInfo.channelName}`}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={copyToClipboard}
          >
            Copy Link
          </Button>
          {copySuccess && (
            <Typography style={{ marginTop: "10px" }}>{copySuccess}</Typography>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
