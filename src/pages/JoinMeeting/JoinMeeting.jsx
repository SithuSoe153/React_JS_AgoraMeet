import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Typography, Button, TextField } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ScreenSharingButtonComponent from "./components/ScreenSharingButtonComponent";
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

  useEffect(() => {
    console.log("Remote Users Updated:", remoteUsers);
  }, [remoteUsers]);

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
      await client.subscribe(user, mediaType);

      // Setting user in the state
      setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));

      // Using a timeout to ensure the element is rendered before playing the track
      setTimeout(() => {
        const elementId = `remote-player-${user.uid}`;

        if (mediaType === "video" || mediaType === "screen") {
          if (document.getElementById(elementId)) {
            user.videoTrack.play(elementId);
          } else {
            console.error(`Element with ID ${elementId} not found`);
          }
        } else if (mediaType === "audio") {
          user.audioTrack.play();
        }
      }, 100); // Adjust this delay if necessary

      fetchTotalUsers();
    } catch (error) {
      console.error("Error handling user-published:", error);
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
        setTotalUsers((prev) => {
          if (response.data.data.total !== prev) {
            return response.data.data.total;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Failed to fetch total users:", error);
    }
  };

  const handleUserUnpublished = (user) => {
    try {
      setRemoteUsers((prev) => {
        const { [user.uid]: removedUser, ...remainingUsers } = prev;
        return remainingUsers;
      });

      fetchTotalUsers();
    } catch (error) {
      console.error("Error handling user-unpublished:", error);
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

  useEffect(() => {
    Object.values(remoteUsers).forEach((user) => {
      const elementId = `remote-player-${user.uid}`;

      if (document.getElementById(elementId)) {
        if (user.videoTrack) {
          user.videoTrack.play(elementId);
        }
      } else {
        console.error(`Element with ID ${elementId} not found`);
      }
    });
  }, [remoteUsers]);

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
        <ScreenSharingButtonComponent
          client={client}
          localTracks={localTracks}
        />
        <Button onClick={leaveChannel}>
          <ExitToAppIcon />
        </Button>
      </div>

      <div
        style={{
          marginTop: "30px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "10px",
        }}
      >
        {Object.keys(remoteUsers).map((uid) => (
          <div
            key={uid}
            id={`remote-player-${uid}`}
            style={{
              width: "100%",
              height: "300px",
              marginBottom: "10px",
              borderRadius: "20px",
              overflow: "hidden",
              position: "relative",
            }}
          >
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
              {remoteUsers[uid].username || uid}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinMeeting;
