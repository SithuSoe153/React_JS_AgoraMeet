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

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const JoinMeeting = () => {
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

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

      setJoined(true); // Mark as joined
    } catch (error) {
      console.error("Failed to join or publish tracks:", error);
    }
  };

  const handleUserPublished = (user, mediaType) => {
    if (mediaType === "video" || mediaType === "screen") {
      const remoteVideoTrack = user.videoTrack;

      const remotePlayerContainer = document.createElement("div");
      remotePlayerContainer.id = `remote-player-${user.uid}`;
      remotePlayerContainer.style.width = "100%";
      remotePlayerContainer.style.height = "200px";
      remotePlayerContainer.style.backgroundColor = "#000";
      remotePlayerContainer.innerText = user.uid; // Displaying user ID
      document.getElementById("remote-players").append(remotePlayerContainer);

      remoteVideoTrack.play(remotePlayerContainer.id);
      setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
    }

    if (mediaType === "audio") {
      user.audioTrack.play();
    }
  };

  const handleUserUnpublished = (user) => {
    const remoteContainer = document.getElementById(
      `remote-player-${user.uid}`
    );
    if (remoteContainer) {
      remoteContainer.remove();
    }
    setRemoteUsers((prev) => {
      const { [user.uid]: removedUser, ...remainingUsers } = prev;
      return remainingUsers;
    });
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
      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });
      await client.leave();
      setLocalTracks([]);
      setRemoteUsers({});
      client.removeAllListeners(); // Remove all event listeners
      setJoined(false); // Mark as not joined
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
              marginTop: "300px",
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

        <ScreenShareButtonComponent />

        <Button onClick={leaveChannel} disabled={!joined}>
          <ExitToAppIcon />
        </Button>
      </div>

      <div id="remote-players"></div>
    </div>
  );
};

export default JoinMeeting;
