import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Typography, Button, TextField } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ScreenShareButtonComponent from "./components/ScreenSharingButtonComponent";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const JoinMeeting = () => {
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  const [searchParams] = useSearchParams();
  const channelName = searchParams.get("channelName");
  const token = searchParams.get("token");

  useEffect(() => {
    return () => {
      if (joined) {
        leaveChannel();
      }
    };
  }, [joined]);

  const init = async () => {
    try {
      if (joined) {
        console.log("Already joined or in the process of joining.");
        return;
      }

      console.log("Joining the channel...");
      await client.join(token, channelName, null, username);
      console.log("Successfully joined the channel");

      const [microphoneTrack, cameraTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack(),
      ]);

      setLocalTracks([microphoneTrack, cameraTrack]);

      cameraTrack.play("local-player");
      await client.publish([microphoneTrack, cameraTrack]);

      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        handleUserPublished(user, mediaType);
      });

      client.on("user-unpublished", handleUserUnpublished);

      setJoined(true);

      // Handle existing users in the channel
      client.remoteUsers.forEach((user) => {
        if (user.hasVideo) {
          handleUserPublished(user, "video");
        }
        if (user.hasAudio) {
          handleUserPublished(user, "audio");
        }
      });

      fetchTotalUsers();
    } catch (error) {
      console.error("Failed to join or publish tracks:", error);
    }
  };

  const handleUserPublished = async (user, mediaType) => {
    try {
      if (mediaType === "audio" && user.audioTrack) {
        user.audioTrack.play();
      }

      if (
        (mediaType === "video" || mediaType === "screen") &&
        user.videoTrack
      ) {
        const remotePlayerContainer = document.getElementById(
          `remote-player-${user.uid}`
        );
        if (!remotePlayerContainer) {
          const newRemotePlayerContainer = document.createElement("div");
          newRemotePlayerContainer.id = `remote-player-${user.uid}`;
          newRemotePlayerContainer.style.width = "100%";
          newRemotePlayerContainer.style.height = "500px";
          newRemotePlayerContainer.style.backgroundColor = "#000";
          newRemotePlayerContainer.style.position = "relative";
          document
            .getElementById("remote-players")
            .append(newRemotePlayerContainer);

          const usernameOverlay = document.createElement("div");
          usernameOverlay.style.position = "absolute";
          usernameOverlay.style.bottom = "10px";
          usernameOverlay.style.left = "10px";
          usernameOverlay.style.color = "#fff";
          usernameOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
          usernameOverlay.style.padding = "5px 10px";
          usernameOverlay.style.borderRadius = "5px";
          usernameOverlay.style.zIndex = "1";
          usernameOverlay.innerText = user.uid || "Unknown User";
          newRemotePlayerContainer.appendChild(usernameOverlay);

          user.videoTrack.play(newRemotePlayerContainer.id);
        }

        setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
        fetchTotalUsers();
      }
    } catch (error) {
      console.error("Error handling user-published:", error);
    }
  };

  const handleUserUnpublished = (user) => {
    try {
      setRemoteUsers((prev) => {
        const { [user.uid]: removedUser, ...remainingUsers } = prev;
        return remainingUsers;
      });

      fetchTotalUsers(); // Adjust or remove depending on how you handle user count
    } catch (error) {
      console.error("Error handling user-unpublished:", error);
    }
  };

  const fetchTotalUsers = async () => {
    try {
      const username = "03ae3eefce0a44b38db5d00f845a6c8d";
      const password = "2ae1a105c72f4a3d816f75a6b2fda68c";
      const token = btoa(`${username}:${password}`);

      const response = await axios.get(
        `https://api.agora.io/dev/v1/channel/user/69b5921596cd4632a94ead5fe6706777/${channelName}`,
        {
          headers: {
            Authorization: `Basic ${token}`,
          },
        }
      );

      if (response.data.success) {
        setTotalUsers(response.data.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch total users:", error);
    }
  };

  const toggleMic = () => {
    if (localTracks[0]) {
      micOn
        ? localTracks[0].setEnabled(false)
        : localTracks[0].setEnabled(true);
      setMicOn((prev) => !prev);
    }
  };

  const toggleCamera = () => {
    if (localTracks[1]) {
      cameraOn
        ? localTracks[1].setEnabled(false)
        : localTracks[1].setEnabled(true);
      setCameraOn((prev) => !prev);
    }
  };

  const joinChannel = async () => {
    if (!joined) {
      await init();
    }
  };

  const leaveChannel = async () => {
    try {
      if (localTracks.length > 0) {
        localTracks.forEach((track) => {
          track.stop();
          track.close();
        });
      }

      await client.leave();
      setLocalTracks([]);
      setRemoteUsers({});
      client.removeAllListeners(); // Ensure no lingering listeners
      setJoined(false);
    } catch (error) {
      console.error("Failed to leave the channel:", error);
    }
  };

  return (
    <div>
      <Typography variant="h5">Join Meeting</Typography>

      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        variant="outlined"
        fullWidth
        style={{ marginBottom: "20px" }}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={joinChannel}
        disabled={joined}
      >
        {joined ? "Joined" : "Join"}
      </Button>

      <div
        id="local-player"
        style={{
          width: "100%",
          height: "550px",
          borderRadius: "20px",
          overflow: "hidden",
          position: "relative",
          marginTop: "20px",
        }}
      >
        {username && (
          <Typography
            variant="h6"
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              color: "#fff",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              padding: "5px 10px",
              borderRadius: "5px",
              zIndex: 1,
            }}
          >
            {username}
          </Typography>
        )}
      </div>

      <div>
        <Button onClick={toggleMic}>
          {micOn ? <MicIcon /> : <MicOffIcon />}
        </Button>
        <Button onClick={toggleCamera}>
          {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
        </Button>
        <ScreenShareButtonComponent
          localTracks={localTracks}
          setLocalTracks={setLocalTracks}
        />
        <Button onClick={leaveChannel}>
          <ExitToAppIcon />
        </Button>
      </div>

      <div
        id="remote-players"
        style={{
          marginTop: "30px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "10px",
        }}
      >
        {Object.values(remoteUsers).map((user) => (
          <div
            key={user.uid}
            id={`remote-player-${user.uid}`}
            style={{
              width: "100%",
              height: "500px",
              backgroundColor: "#000",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                color: "#fff",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                padding: "5px 10px",
                borderRadius: "5px",
                zIndex: "1",
              }}
            >
              {user.uid || "Unknown User"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinMeeting;
