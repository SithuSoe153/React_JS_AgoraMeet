import React, { useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { Button } from "@mui/material";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";

const ScreenSharingButtonComponent = ({ client, localTracks }) => {
  const [screenTrack, setScreenTrack] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  const startScreenSharing = async () => {
    if (!client) {
      console.error("Agora client is not initialized");
      return;
    }

    try {
      // Create screen video track
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1",
        optimizationMode: "detail",
      });

      setScreenTrack(screenTrack);

      // Unpublish local camera track (optional)
      await client.unpublish(localTracks[1]); // Assuming localTracks[1] is the camera track

      // Publish the screen video track
      await client.publish(screenTrack);

      // Play on local screen (optional for the sharer to see their own screen)
      const localScreenPlayer = document.getElementById("local-screen-player");
      if (localScreenPlayer) {
        screenTrack.play("local-screen-player");
      }

      screenTrack.on("track-ended", async () => {
        console.log("Screen sharing stopped");
        await stopScreenSharing();
      });

      setIsSharing(true);
    } catch (error) {
      console.error("Error starting screen sharing", error);
    }
  };

  const stopScreenSharing = async () => {
    if (screenTrack) {
      await client.unpublish(screenTrack);
      screenTrack.stop();
      screenTrack.close();
    }

    // Re-publish the local camera track (optional)
    if (localTracks[1]) {
      await client.publish(localTracks[1]);
      localTracks[1].play("local-player");
    }

    setIsSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isSharing) {
      await stopScreenSharing();
    } else {
      await startScreenSharing();
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
