import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Typography, Button } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import HandIcon from "@mui/icons-material/ThumbUpAlt";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useLocation } from "react-router-dom";
import ScreenSharingButtonComponent from "./ScreenSharingButtonComponent";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const HostComponent = () => {
  const { state } = useLocation();
  const { channelName, token } = state || {};

  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [recording, setRecording] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        console.log("Joining the channel...");
        await client.join(token, channelName, null, null);
        console.log("Successfully joined the channel");

        const [microphoneTrack, cameraTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack(),
        ]);

        if (isMounted) {
          setLocalTracks([microphoneTrack, cameraTrack]);

          cameraTrack.play("local-player");
          await client.publish([microphoneTrack, cameraTrack]);

          client.on("user-published", async (user, mediaType) => {
            try {
              console.log("User Published:", user.uid);
              if (mediaType === "video" || mediaType === "audio") {
                await client.subscribe(user, mediaType);
                console.log("User Subscribed:", user.uid);

                if (mediaType === "video") {
                  const remoteVideoTrack = user.videoTrack;

                  // Check if a container already exists for this user
                  let remotePlayerContainer = document.getElementById(
                    `remote-player-${user.uid}`
                  );
                  if (!remotePlayerContainer) {
                    remotePlayerContainer = document.createElement("div");
                    remotePlayerContainer.id = `remote-player-${user.uid}`;
                    remotePlayerContainer.style.width = "100%";
                    remotePlayerContainer.style.height = "200px";
                    remotePlayerContainer.style.backgroundColor = "#000";
                    remotePlayerContainer.style.position = "relative";
                    remotePlayerContainer.innerText = ""; // Clear any previous text

                    const usernameOverlay = document.createElement("div");
                    usernameOverlay.style.position = "absolute";
                    usernameOverlay.style.bottom = "10px";
                    usernameOverlay.style.left = "10px";
                    usernameOverlay.style.color = "#fff";
                    usernameOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
                    usernameOverlay.style.padding = "5px 10px";
                    usernameOverlay.style.borderRadius = "5px";
                    usernameOverlay.innerText = user.name || user.uid;

                    remotePlayerContainer.appendChild(usernameOverlay);
                    document
                      .getElementById("remote-players")
                      .append(remotePlayerContainer);

                    // Play the video track in the created container
                    remoteVideoTrack.play(remotePlayerContainer.id);
                    setRemoteUsers((prev) => [...prev, user]);
                  }
                }

                if (mediaType === "audio") {
                  user.audioTrack.play();
                }
              }
            } catch (error) {
              console.error("Error handling user-published event:", error);
            }
          });

          client.on("user-unpublished", (user, mediaType) => {
            if (mediaType === "video" || mediaType === "audio") {
              const remoteContainer = document.getElementById(
                `remote-player-${user.uid}`
              );
              if (remoteContainer) {
                remoteContainer.remove();
              }
              setRemoteUsers((prev) =>
                prev.filter((u) => u.uid !== user.uid)
              );
            }
          });
        }
      } catch (error) {
        console.error("Failed to join or publish tracks:", error);
      }
    };

    init();

    return () => {
      isMounted = false;
      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });
      client.leave().then(() => {
        setLocalTracks([]);
        setRemoteUsers([]);
        client.removeAllListeners(); // Remove all event listeners
      });
    };
  }, [token, channelName]);

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

  const toggleRecording = () => {
    setRecording((prev) => !prev);
  };

  const toggleHandRaised = () => {
    setHandRaised((prev) => !prev);
  };

  const leaveChannel = async () => {
    try {
      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });
      await client.leave();
      setLocalTracks([]);
      setRemoteUsers([]);
      client.removeAllListeners(); // Remove all event listeners
    } catch (error) {
      console.error("Failed to leave the channel:", error);
    }
  };

  return (
    <div>
      <Typography variant="h5">Host Meeting</Typography>
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
      ></div>

      <div>
        <Button onClick={toggleMic}>
          {micOn ? <MicIcon /> : <MicOffIcon />}
        </Button>

        <Button onClick={toggleCamera}>
          {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
        </Button>

        <ScreenSharingButtonComponent />

        <Button onClick={toggleRecording}>
          <RecordVoiceOverIcon color={recording ? "error" : "inherit"} />
        </Button>

        <Button onClick={toggleHandRaised}>
          <HandIcon color={handRaised ? "primary" : "inherit"} />
        </Button>

        <Button onClick={leaveChannel}>
          <ExitToAppIcon />
        </Button>
      </div>

      <div id="remote-players"></div>
    </div>
  );
};

export default HostComponent;
