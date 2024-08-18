import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";
import { TextField, Button, Typography } from "@mui/material";
import axios from "axios";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const JoinMeeting = () => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const channelName = searchParams.get("channelName");
  const token = searchParams.get("token");

  const joinMeeting = async () => {
    if (!username || !channelName || !token) {
      setError("Please provide all required information.");
      return;
    }

    setIsJoining(true); // Start joining process

    try {
      // Use the proxy path
      await axios.get(
        `/api/social-commerce-backend/v1/chat/room/user/${encodeURIComponent(
          username
        )}/token?channelName=${encodeURIComponent(channelName)}`
      );

      await client.join(token, channelName, null, null);

      const localTrack = await AgoraRTC.createMicrophoneAndCameraTracks();
      await client.publish([localTrack.audioTrack, localTrack.videoTrack]);

      setJoined(true);
    } catch (err) {
      console.error("Error joining the meeting:", err);
      setError("Failed to join the meeting. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {!joined ? (
        <div>
          <Typography variant="h5">Join the Meeting</Typography>
          <TextField
            label="Enter your name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={joinMeeting}
            disabled={isJoining}
          >
            {isJoining ? "Joining..." : "Join Meeting"}
          </Button>
          {error && <Typography color="error">{error}</Typography>}
        </div>
      ) : (
        <Typography variant="h6">
          Welcome, {username}! You have joined the meeting.
        </Typography>
      )}
    </div>
  );
};

export default JoinMeeting;
