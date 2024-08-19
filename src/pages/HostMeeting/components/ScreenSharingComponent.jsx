import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Button, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";

import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";

const ScreenSharingComponent = () => {
  const { state } = useLocation();
  const { channelName, token } = state || {};

  const [client, setClient] = useState(null);
  const [screenTrack, setScreenTrack] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const initClient = async () => {
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(agoraClient);
    };
    initClient();

    return () => {
      leaveChannel();
    };
  }, []);

  const startScreenSharing = async () => {
    try {
      // Join the channel
      await client.join(token, channelName, null, null);

      // Create screen video track
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1",
        optimizationMode: "detail",
      });

      setScreenTrack(screenTrack);

      // Publish the screen video track
      await client.publish(screenTrack);

      screenTrack.play("local-player");

      screenTrack.on("track-ended", () => {
        console.log("Screen sharing stopped");
        leaveChannel();
      });

      setIsSharing(true);
    } catch (error) {
      console.error("Error starting screen sharing", error);
    }
  };

  const leaveChannel = async () => {
    if (screenTrack) {
      screenTrack.stop();
      screenTrack.close();
    }
    if (client) {
      await client.leave();
    }
    setIsSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isSharing) {
      leaveChannel();
    } else {
      startScreenSharing();
    }
  };

  return (
    <>
      <Button onClick={toggleScreenShare}>
        {isSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
      </Button>
    </>
  );
};

export default ScreenSharingComponent;
