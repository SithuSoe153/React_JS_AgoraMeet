import React, { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Typography, Button } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';import HandIcon from '@mui/icons-material/ThumbUpAlt';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useLocation } from "react-router-dom";

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

const HostComponent = () => {
  const { state } = useLocation();
  const { channelName, token } = state || {};
  
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenShareOn, setScreenShareOn] = useState(false);
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

          const localContainer = document.createElement('div');
          localContainer.id = 'local-player';
          localContainer.style.width = '100%';
          localContainer.style.height = '240px';
          localContainer.style.backgroundColor = '#000';
          document.body.append(localContainer);

          cameraTrack.play('local-player');
          await client.publish([microphoneTrack, cameraTrack]);

          client.on('user-published', async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            if (mediaType === 'video') {
              const remoteVideoTrack = user.videoTrack;
              const remoteContainer = document.createElement('div');
              remoteContainer.id = `remote-player-${user.uid}`;
              remoteContainer.style.width = '100%';
              remoteContainer.style.height = '240px';
              remoteContainer.style.backgroundColor = '#000';
              document.body.append(remoteContainer);

              remoteVideoTrack.play(`remote-player-${user.uid}`);
              setRemoteUsers((prev) => [...prev, user]);
            }
            if (mediaType === 'audio') {
              user.audioTrack.play();
            }
          });

          client.on('user-unpublished', (user) => {
            const remoteContainer = document.getElementById(`remote-player-${user.uid}`);
            if (remoteContainer) {
              remoteContainer.remove();
            }
            setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
          });
        }
      } catch (error) {
        console.error('Failed to join or publish tracks:', error);
      }
    };

    init();

    return () => {
      isMounted = false;

      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });

      client.leave().catch(error => {
        console.error('Failed to leave the channel:', error);
      });
    };
  }, [channelName, token]);

  
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
    const screenTrack = localTracks.find(track => track.type === 'video' && track.source === 'screen');
    if (screenTrack) {
      await client.unpublish(screenTrack);
      screenTrack.stop();
      setLocalTracks(prev => prev.filter(track => track !== screenTrack));
      setScreenShareOn(false);

      // Re-publish the camera track if it was stopped earlier
      const cameraTrack = await AgoraRTC.createCameraVideoTrack();
      setLocalTracks(prev => [...prev, cameraTrack]);
      await client.publish(cameraTrack);
      cameraTrack.play('local-player');
    }
  } else {
    try {
      // Unpublish the camera track before starting screen share
      const cameraTrack = localTracks.find(track => track.type === 'video' && track.source !== 'screen');
      if (cameraTrack) {
        await client.unpublish(cameraTrack);
        cameraTrack.stop();
        setLocalTracks(prev => prev.filter(track => track !== cameraTrack));
      }

      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: "1080p_1",
        optimizationMode: "detail"
      });
      await client.publish(screenTrack);
      setLocalTracks(prev => [...prev, screenTrack]);
      setScreenShareOn(true);

      // Play screen share on the local player
      screenTrack.play('local-player');
    } catch (error) {
      console.error("Failed to start screen share:", error);
    }
  }
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
    client.leave().catch(error => {
      console.error('Failed to leave the channel:', error);
    });
  };

  return (
    <div>
      <Typography variant="h5">Host Meeting</Typography>
      <div>
        <Button onClick={toggleMic}>
          {micOn ? <MicIcon /> : <MicOffIcon />}
        </Button>
        <Button onClick={toggleCamera}>
          {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
        </Button>
        <Button onClick={toggleScreenShare}>
          {screenShareOn ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        </Button>
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
          <div key={user.uid}>
            {user.videoTrack && <div id={`remote-${user.uid}`} />}
            {user.audioTrack && <div>Audio for {user.uid}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HostComponent;
