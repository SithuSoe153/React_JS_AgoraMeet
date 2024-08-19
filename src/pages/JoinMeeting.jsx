import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { TextField, Button, Typography } from "@mui/material";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const JoinMeeting = () => {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenShareOn, setScreenShareOn] = useState(false);

  const channelName = searchParams.get("channelName");
  const token = searchParams.get("token");

  useEffect(() => {
    return () => {
      if (joined) {
        localTracks.forEach(track => {
          track.stop();
          track.close();
        });
        client.leave().catch(error => {
          console.error("Failed to leave the channel:", error);
        });
      }
    };
  }, [joined, localTracks]);

  useEffect(() => {
    if (joined) {
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        if (mediaType === "video" || mediaType === "screen") {
          const remoteContainer = document.createElement("div");
          remoteContainer.id = `remote-player-${user.uid}`;
          remoteContainer.style.width = "100%";
          remoteContainer.style.height = "240px";
          remoteContainer.style.backgroundColor = "#000";
          document.getElementById("remote-players").append(remoteContainer);

          user.videoTrack.play(remoteContainer.id);
          setRemoteUsers(prev => [...prev, user]);
        }

        if (mediaType === "audio") {
          user.audioTrack.play();
        }
      });

      client.on("user-unpublished", (user) => {
        const remoteContainer = document.getElementById(`remote-player-${user.uid}`);
        if (remoteContainer) {
          remoteContainer.remove();
        }
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });
    }
  }, [joined]);

  const joinMeeting = async () => {
    if (!username || !channelName || !token) {
      setError("Please provide all required information.");
      return;
    }

    setIsJoining(true);

    try {
      await axios.get(
        `/api/social-commerce-backend/v1/chat/room/user/${encodeURIComponent(
          username
        )}/token?channelName=${encodeURIComponent(channelName)}`
      );

      await client.join(token, channelName, null, username);

      const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks([microphoneTrack, cameraTrack]);

      await client.publish([microphoneTrack, cameraTrack]);

      setJoined(true);
    } catch (err) {
      console.error("Error joining the meeting:", err);
      setError("Failed to join the meeting. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const toggleMic = () => {
    micOn ? localTracks[0].setEnabled(false) : localTracks[0].setEnabled(true);
    setMicOn((prev) => !prev);
  };

  const toggleCamera = () => {
    cameraOn ? localTracks[1].setEnabled(false) : localTracks[1].setEnabled(true);
    setCameraOn((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    if (screenShareOn) {
      const screenTrack = localTracks.find(track => track.getTrackId());
      if (screenTrack) {
        screenTrack.stop();
        await client.unpublish(screenTrack);
        document.getElementById('screen-share').remove();
        setScreenShareOn(false);
      }
    } else {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack();
        await client.publish(screenTrack);
        setLocalTracks(prev => [...prev, screenTrack]);

        const screenContainer = document.createElement('div');
        screenContainer.id = 'screen-share';
        screenContainer.style.width = '100%';
        screenContainer.style.height = '240px';
        screenContainer.style.backgroundColor = '#000';
        document.body.append(screenContainer);
        screenTrack.play('screen-share');

        setScreenShareOn(true);
      } catch (error) {
        console.error("Failed to start screen share:", error);
      }
    }
  };

  const leaveChannel = () => {
    localTracks.forEach(track => {
      track.stop();
      track.close();
    });
    client.leave().catch(error => {
      console.error('Failed to leave the channel:', error);
    });
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
        <div>
          <Typography variant="h6">
            Welcome, {username}! You have joined the meeting.
          </Typography>
          <div
            id="local-player"
            style={{ width: "100%", height: "240px", backgroundColor: "#000" }}
          ></div>
          <div id="remote-players" style={{ width: "100%", marginTop: "20px" }}></div>
          <div>
            <Button onClick={toggleMic}>
              {micOn ? <MicIcon /> : <MicOffIcon />}
            </Button>
            <Button onClick={toggleCamera}>
              {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
            </Button>
            <Button onClick={toggleScreenShare}>
              <ScreenShareIcon />
            </Button>
            <Button onClick={leaveChannel}>
              <ExitToAppIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinMeeting;
