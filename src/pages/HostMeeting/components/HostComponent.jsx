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
            await client.subscribe(user, mediaType);
            if (mediaType === "video") {
              const remoteVideoTrack = user.videoTrack;

              remoteVideoTrack.play(`remote-player-${user.uid}`);
              setRemoteUsers((prev) => [...prev, user]); // Add the user to the remoteUsers array
            }
            if (mediaType === "audio") {
              user.audioTrack.play();
            }
          });

          client.on("user-unpublished", (user) => {
            const remoteContainer = document.getElementById(
              `remote-player-${user.uid}`
            );
            if (remoteContainer) {
              remoteContainer.remove();
            }
            setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
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

      client.leave().catch((error) => {
        console.error("Failed to leave the channel:", error);
      });
    };
  }, [channelName, token]);

  const toggleMic = () => {
    micOn ? localTracks[0].setEnabled(false) : localTracks[0].setEnabled(true);
    setMicOn((prev) => !prev);
  };

  const toggleCamera = () => {
    cameraOn
      ? localTracks[1].setEnabled(false)
      : localTracks[1].setEnabled(true);
    setCameraOn((prev) => !prev);
  };

  const toggleRecording = () => {
    setRecording((prev) => !prev);
  };

  const toggleHand = () => {
    setHandRaised((prev) => !prev);
  };

  const leaveChannel = () => {
    localTracks.forEach((track) => {
      track.stop();
      track.close();
    });
    client.leave().catch((error) => {
      console.error("Failed to leave the channel:", error);
    });
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
        }}
      ></div>

      <div
        id="local-screen-player"
        style={{
          width: "100%",
          height: "550px",
          borderRadius: "20px",
          overflow: "hidden",
          position: "relative",
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

        <Button onClick={toggleHand}>
          <HandIcon />
        </Button>
        <Button onClick={toggleRecording}>
          <RecordVoiceOverIcon />
        </Button>
        <Button onClick={leaveChannel}>
          <ExitToAppIcon />
        </Button>
      </div>

      <div>
        {remoteUsers.map((user) => (
          <div
            key={user.uid}
            id={`remote-player-${user.uid}`}
            style={{
              width: "100%",
              height: "200px",
              marginTop: "10px",
              overflow: "hidden",
              position: "relative",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HostComponent;
