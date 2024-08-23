import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Button } from "@mui/material";
import { useSearchParams } from "react-router-dom";

import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";

const ScreenSharingButtonComponent = () => {
  const [searchParams] = useSearchParams();
  const channelName = searchParams.get("channelName");
  const token = searchParams.get("token");

  const [client, setClient] = useState(null);
  const [screenTrack, setScreenTrack] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const initClient = async () => {
      try {
        const agoraClient = AgoraRTC.createClient({
          mode: "rtc",
          codec: "vp8",
        });
        setClient(agoraClient);
      } catch (error) {
        console.error("Failed to initialize Agora client", error);
      }
    };
    initClient();

    return () => {
      leaveChannel();
    };
  }, []);

  const startScreenSharing = async () => {
    if (!client) {
      console.error("Agora client is not initialized");
      return;
    }

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

      // Play on local screen (optional for the sharer to see their own screen)
      const localScreenPlayer = document.getElementById("local-screen-player");
      if (localScreenPlayer) {
        screenTrack.play("local-screen-player");
      }

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
      <div
        id="local-screen-player"
        style={{ width: "100%", height: "500px" }}
      ></div>

      <Button onClick={toggleScreenShare}>
        {isSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
      </Button>
    </>
  );
};

export default ScreenSharingButtonComponent;
