import React, { useEffect, useState, useRef, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import AgoraRTM from "agora-rtm-sdk";
import { useLocation } from "react-router-dom";

import { styled, useTheme } from '@mui/material/styles';


// Buttons


import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import RecordIcon from '@mui/icons-material/RadioButtonChecked';
import ChatIcon from '@mui/icons-material/Chat';
import ChatOffIcon from '@mui/icons-material/ChatBubble';
import PeopleIcon from '@mui/icons-material/People';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import InfoIcon from "@mui/icons-material/Info";

import "../styles/room.css";
import GradientIconButton from "../components/Buttons/GradientIconButton"
import { Box, Button, Drawer, IconButton, Typography, Divider, CssBaseline, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Menu } from "@mui/material";
import MuiAppBar from '@mui/material/AppBar';

const drawerWidth = 400;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    // marginRight: open ? 0 : `-${drawerWidth}px`, // Use negative margin to move content
    marginRight: open ? 0 : `-${drawerWidth}px`, // Use negative margin to move content
    width: open ? `calc(100% - ${drawerWidth}px)` : '100%', // Adjust width
    ...(open && {
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  })
);


const Room = () => {
  const location = useLocation();
  const theme = useTheme();
  const displayName = sessionStorage.getItem("display_name") || "default_user";
  const formattedUid = displayName.replace(/\s+/g, "_");


  const streamBoxRef = useRef(null); // Stream container reference
  const videoContainerRef = useRef(null); // Video container reference
  const userIdInDisplayFrame = useRef(null); // Reference to store the current user in display frame


  const { prevMicOn, prevCameraOn } = location.state || {}; // Access the state passed from Lobby.jsx

  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [joined, setJoined] = useState(false);

  const [meetingGuid, setMeetingGuid] = useState(new URLSearchParams(window.location.search).get("room")
  );
  const [groupId, setGroupId] = useState(null);
  const [rtcToken, setRtcToken] = useState(null);
  const [channelName, setChannelName] = useState(null);

  const [micOn, setMicOn] = useState(prevMicOn);
  const [cameraOn, setCameraOn] = useState(prevCameraOn);
  const [bothOff, setBothOff] = useState(!micOn && !cameraOn); // Track if both are off

  const [sharingScreen, setSharingScreen] = useState(false);

  const [leftMeeting, setLeftMeeting] = useState(false); // New state for tracking if user left

  const [fullscreen, setFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };


  // const drawerWidth = 400;

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


  const client = useRef(null);
  const rtmClient = useRef(null);
  const channel = useRef(null);
  const APP_ID = "19547e2b1603452688a040cc0a219aea";



  const toggleDrawer = () => {
    setOpen(!open);
  };



  useEffect(() => {
    const init = async () => {
      // Initializing RTC client
      client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // Fetch meeting details, tokens, etc.
      const meetingDetails = await fetchMeetingDetails();

      // Destructure the meeting details to get rtcToken and channelName
      const { token: rtcToken, channelName } = meetingDetails;
      let uid = Math.floor(Math.random() * 10000);


      // Join the RTC channel
      await client.current.join(rtcToken, channelName, null, formattedUid);

      // Event listeners
      client.current.on("user-published", handleUserPublished);
      client.current.on("user-left", handleUserLeft);

      setJoined(true);
      joinStream();
    };

    init();

    return () => {
      // Clean up on unmount
      if (client.current) {
        client.current.leave();
      }
    };
  }, []);



  const fetchMeetingDetails = async () => {
    try {
      const response = await fetch(
        `https://dev.gigagates.com/social-commerce-backend/v1/chat/room/list?chatRoomGuid=${meetingGuid}`
      );
      const data = await response.json();

      if (response.ok && data && data.data) {
        // Return the needed details
        return {
          token: data.data.token,
          channelName: data.data.channelName,
          groupId: data.data.groupId
        };
      } else {
        console.error("Failed to fetch meeting details:", data);
        alert("Failed to fetch meeting details and information.");
      }
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      alert("An error occurred while fetching meeting details and information.");
    }
  };



  const joinStream = async () => {
    try {
      let audioTrack, videoTrack;

      // Create audio track regardless of initial mic setting
      // audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ muted: !micOn });
      audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ muted: !micOn });

      // Create video track based on camera setting
      videoTrack = await AgoraRTC.createCameraVideoTrack({ muted: !cameraOn });

      const tracksToPublish = [audioTrack, videoTrack];
      setLocalTracks([audioTrack, videoTrack]);

      // Create player container for local user
      if (!document.getElementById("user-container-local")) {
        const player = document.createElement("div");
        player.className = "video__container";
        player.id = `user-container-local`;
        player.onclick = expandVideoFrame; // Assign the click handler

        player.innerHTML = `
        <div class="video-player" id="user-local"></div>
          <div class="video-name">${displayName} (You)</div>
        <div class="placeholder" id="placeholder-local">Camera is Off</div>
 `;

        document.getElementById("streams__container").appendChild(player);


      }

      const placeholder = document.getElementById("placeholder-local");

      // Always show the container
      const localContainer = document.getElementById("user-container-local");
      localContainer.style.display = "block";

      // Publish tracks initially
      await client.current.publish(tracksToPublish);

      // Handle mic and camera states after publishing
      if (!micOn) {
        await audioTrack.setMuted(true); // Mute audio instead of disabling
      }

      if (!cameraOn) {
        await videoTrack.setMuted(true); // Mute video instead of disabling
        placeholder.style.display = "block"; // Show placeholder if video is off
      } else {
        videoTrack.play("user-local");
        placeholder.style.display = "none"; // Hide placeholder if video is available
      }

      // Handle user-published event
      client.current.on("user-published", handleUserPublished);

    } catch (error) {
      console.error("Error joining stream:", error);
    }
  };

  const expandVideoFrame = (e) => {
    const displayFrame = streamBoxRef.current;
    const videoFrames = document.getElementsByClassName("video__container");
    const clickedElement = e.currentTarget;

    if (displayFrame.firstChild && displayFrame.firstChild.id === clickedElement.id) {
      // Reset the display frame and resize all videos back to normal
      displayFrame.style.display = "none";

      // Only append if it's not already a child
      const originalContainer = document.getElementById("streams__container");
      if (clickedElement && originalContainer && !originalContainer.contains(clickedElement)) {
        originalContainer.appendChild(clickedElement);
      }

      // Reset dimensions for all videos
      for (let i = 0; i < videoFrames.length; i++) {
        videoFrames[i].style.height = ""; // Reset height
        videoFrames[i].style.width = ""; // Reset width
      }
    } else {
      // Remove any current video in display frame if it exists
      if (displayFrame.firstChild) {
        const existingChild = displayFrame.firstChild;
        const originalContainer = document.getElementById("streams__container");
        if (originalContainer && !originalContainer.contains(existingChild)) {
          originalContainer.appendChild(existingChild);
        }
      }

      // Display the clicked video in expanded mode
      displayFrame.style.display = "block";
      displayFrame.appendChild(clickedElement);
      userIdInDisplayFrame.current = clickedElement.id;

      // Resize other videos to small size
      for (let i = 0; i < videoFrames.length; i++) {
        if (videoFrames[i].id !== userIdInDisplayFrame.current) {
          videoFrames[i].style.height = "100px";
          videoFrames[i].style.width = "100px";
        }
      }
    }
  };



  const toggleFullscreen = (e) => {
    const displayFrame = streamBoxRef.current;

    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (displayFrame.requestFullscreen) {
        displayFrame.requestFullscreen();
      } else if (displayFrame.mozRequestFullScreen) { // For Firefox
        displayFrame.mozRequestFullScreen();
      } else if (displayFrame.webkitRequestFullscreen) { // For Chrome, Safari, and Opera
        displayFrame.webkitRequestFullscreen();
      } else if (displayFrame.msRequestFullscreen) { // For IE/Edge
        displayFrame.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen and reset video frame
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          // Reset to small view after exiting fullscreen
          expandVideoFrame(e);
        });
      } else if (document.mozCancelFullScreen) { // For Firefox
        document.mozCancelFullScreen().then(() => {
          expandVideoFrame(e);
        });
      } else if (document.webkitExitFullscreen) { // For Chrome, Safari, and Opera
        document.webkitExitFullscreen().then(() => {
          expandVideoFrame(e);
        });
      } else if (document.msExitFullscreen) { // For IE/Edge
        document.msExitFullscreen().then(() => {
          expandVideoFrame(e);
        });
      }
    }
  };



  const handleUserPublished = async (user, mediaType) => {
    console.log(`User published: ${user.uid}, MediaType: ${mediaType}`);
    try {
      await client.current.subscribe(user, mediaType);

      // Create the user container if it doesn't exist
      let playerContainer = document.getElementById(`user-container-${user.uid}`);

      if (!playerContainer) {
        const player = document.createElement("div");
        player.className = "video__container";
        player.id = `user-container-${user.uid}`;
        player.onclick = expandVideoFrame; // Assign the click handler

        player.innerHTML = `
 <div class="video-player" id="user-${user.uid}"></div>
 <div class="video-name">${user.uid?.replace(/_/g, " ")}</div>
 <div class="placeholder" id="placeholder-${user.uid}" style="display: none;"></div>
 `;

        document.getElementById("streams__container").appendChild(player);
      }

      const placeholder = document.getElementById(`placeholder-${user.uid}`);
      const hasVideoTrack = user.videoTrack && mediaType === "video";
      const hasAudioTrack = user.audioTrack && mediaType === "audio";

      // Manage placeholder visibility based on video track
      if (!hasAudioTrack && !hasVideoTrack) {
        placeholder.style.display = "none";
      } else {
        if (!hasAudioTrack && !hasVideoTrack) {
          if (placeholder) {
            placeholder.style.display = "block";
            placeholder.innerText = "Camera and Mic are Off";
            alert(`User ${user.uid} has joined with Camera and Mic OFF!`);
          }
        }

        if (hasVideoTrack && !hasAudioTrack) {
          user.videoTrack.play(`user-${user.uid}`);
          if (placeholder) placeholder.style.display = "none";
        }
      }

      if (hasAudioTrack) {
        user.audioTrack.play();
      }
    } catch (error) {
      console.error(`Error handling user published: ${error}`);
    }
  };

  const handleUserLeft = (user) => {
    delete remoteUsers[user.uid];
    let item = document.getElementById(`user-container-${user.uid}`);
    if (item) {
      item.remove();
    }
  };



  const toggleMic = async () => {
    try {
      if (micOn) {
        // If the mic is on, stop and remove the audio track
        if (localTracks[0]) {
          await localTracks[0].stop();
          await localTracks[0].close();
          setLocalTracks((prevTracks) => [null, prevTracks[1]]);
        }
        setMicOn(false);
        console.log("Microphone disabled.");
      } else {
        // If the mic is off, create a new microphone audio track
        const newAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalTracks((prevTracks) => [newAudioTrack, prevTracks[1]]);
        await client.current.publish([newAudioTrack]);
        setMicOn(true);
        console.log("Microphone enabled.");
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };

  const toggleCamera = async () => {
    try {
      if (!cameraOn) {
        // Camera is off, so we turn it on
        if (!localTracks[1]) {
          // If the track was closed or not initialized, create a new camera video track
          localTracks[1] = await AgoraRTC.createCameraVideoTrack();
          setLocalTracks((prevTracks) => [prevTracks[0], localTracks[1]]);
        }

        await client.current.publish([localTracks[1]]); // Publish the video track
        localTracks[1].play("user-local"); // Play the local video

        const placeholder = document.getElementById("placeholder-local");
        if (placeholder) placeholder.style.display = "none";

        setCameraOn(true);
        setBothOff(!micOn && false);
        console.log("Camera turned on.");
      } else {
        // Camera is on, so we turn it off
        if (localTracks[1]) {
          localTracks[1].stop(); // Stop sending video frames, turns off the camera
          await client.current.unpublish([localTracks[1]]); // Unpublish the video track
          localTracks[1].close();  // Fully close the track and release the camera
          localTracks[1] = null; // Set to null to ensure new track is created next time
        }

        setCameraOn(false);
        setBothOff(!micOn && true);

        const placeholder = document.getElementById("placeholder-local");
        if (placeholder) placeholder.style.display = "block";

        console.log("Camera turned off.");
      }
    } catch (error) {
      console.error("Error toggling the camera: ", error);
    }
  };



  const toggleScreen = async () => {
    if (!sharingScreen) {
      try {
        // Create screen track for sharing
        const screenTracks = await AgoraRTC.createScreenVideoTrack();

        // Unpublish the current camera track before switching
        if (localTracks[1]) {
          await client.current.unpublish([localTracks[1]]);
          localTracks[1].stop();
          localTracks[1].close();
        }

        // Publish the screen track
        await client.current.publish([screenTracks]);
        setLocalTracks((prevTracks) => [prevTracks[0], screenTracks]);
        setSharingScreen(true);

        // Display screen share in the local container
        let screenContainer = document.getElementById("user-container-local");
        if (!screenContainer) {
          const screenPlayer = `
            <div class="video__container" id="user-container-local">
              <div class="video-player" id="user-local"></div>
            </div>`;
          document.getElementById("streams__container").insertAdjacentHTML("beforeend", screenPlayer);
        }
        screenTracks.play("user-local");

      } catch (error) {
        console.error("Error starting screen share:", error);
      }
    } else {
      try {
        // Stop screen sharing and switch back to the camera
        localTracks[1].stop();
        await client.current.unpublish([localTracks[1]]);

        // Recreate the camera track
        const cameraTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalTracks((prevTracks) => [prevTracks[0], cameraTrack]);

        // Publish the camera track again
        await client.current.publish([cameraTrack]);
        cameraTrack.play("user-local");

        setSharingScreen(false);
      } catch (error) {
        console.error("Error stopping screen share:", error);
      }
    }
  };



  const handleRejoin = () => {
    // Logic for rejoining the stream
    setJoined(true);
    setLeftMeeting(false); // Reset when rejoining
  };

  const leaveStream = async () => {
    try {
      // Stop and close all local tracks
      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });

      // Unpublish all tracks
      await client.current.unpublish(localTracks);

      // Remove local video container
      const localContainer = document.getElementById("user-container-local");
      if (localContainer) {
        localContainer.remove();
      }

      setLocalTracks([]);
      setJoined(false);
      setSharingScreen(false);
      setLeftMeeting(true);

      // Leave the Agora RTC client
      await client.current.leave();
    } catch (error) {
      console.error("Error leaving the stream:", error);
    }
  };


  const switchToCamera = async () => {
    const player = `
 <div className="video__container" id="user-container-${uid.current}">
 <div className="video-player" id="user-${uid.current}"></div>
 </div>`;
    document
      .getElementById("streams__container")
      .insertAdjacentHTML("beforeend", player);

    localTracks[1].play(`user-${uid.current}`);
    await client.current.publish(localTracks[1]);
  };


  return (


    <Box sx={{ display: 'flex' }}>


      {/* <header id="nav">
        <div className="nav--list">
          <button id="members__button">
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fillRule="evenodd"
              clipRule="evenodd"
            >
              <path d="M24 19h-24v-1h24v1zm0-6h-24v-1h24v1zm0-6h-24v-1h24v1z" />
            </svg>
          </button>
          <a href="lobby.html">
            <h3 id="logo">
              <span>Meet.MyDay</span>
            </h3>
          </a>
        </div>

        <div id="nav__links">
          <button id="chat__button">
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fillRule="evenodd"
              fill="#ede0e0"
              clipRule="evenodd"
            >
              <path d="M24 20h-3v4l-5.333-4h-7.667v-4h2v2h6.333l2.667 2v-2h3v-8.001h-2v-2h4v12.001zm-15.667-6l-5.333 4v-4h-3v-14.001l18 .001v14h-9.667zm-6.333-2h3v2l2.667-2h8.333v-10l-14-.001v10.001z" />
            </svg>
          </button>
          <a className="nav__link" id="copy__link__btn">
            Copy Share Link
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="#ede0e0"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z" />
            </svg>
          </a>
        </div>
      </header> */}




      <Box sx={{ flexShrink: 0 }}>
        {/* Control Buttons Section */}
        {joined && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              backgroundColor: '#1a1a1a', // Example background to separate it visually
              padding: '16px',
              position: 'fixed', // Fix it at the top/bottom or as required
              bottom: 0, // If you want it at the bottom
              width: '100%',
            }}
          >

            <GradientIconButton onClick={toggleMic} isSelected={micOn}>
              {micOn ? <MicIcon /> : <MicOffIcon />}
            </GradientIconButton>

            <GradientIconButton onClick={toggleCamera} isSelected={cameraOn}>
              {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
            </GradientIconButton>

            <GradientIconButton onClick={toggleScreen} isSelected={sharingScreen}>
              {sharingScreen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </GradientIconButton>

            <GradientIconButton>
              <RecordIcon />
            </GradientIconButton>


            {/*  */}

            <GradientIconButton>
              <InfoIcon />
            </GradientIconButton>

            <GradientIconButton>
              <PeopleIcon />
            </GradientIconButton>

            <GradientIconButton onClick={toggleDrawer} isSelected={open}>
              {open ? <ChatOffIcon /> : <ChatIcon />}
            </GradientIconButton>



            <Button
              onClick={leaveStream}
              variant="contained"
              color="error"
            >
              Leave
            </Button>
          </Box>
        )}
      </Box>


      <Main open={open}>
        <main className="container">
          <div id="room__container" style={{ flexGrow: 1 }}>
            <div id="stream__box" ref={streamBoxRef} style={{ position: 'relative' }}>
              {isFullscreen ? (
                <FullscreenExitIcon
                  onClick={toggleFullscreen}
                  className="fullscreen-btn"
                />
              ) : (
                <FullscreenIcon
                  onClick={toggleFullscreen}
                  className="fullscreen-btn"
                />
              )}
            </div>
            <div id="streams__container"></div>
          </div>
        </main>
      </Main>



      {/* Persistent Drawer for Participants and Chat Messages */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0, // Prevent shrinking
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          '& .MuiDrawer-paper': {
            width: drawerWidth, // Ensure the paper has the correct width
            transition: theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          },
        }}
        variant="persistent"
        anchor="right"
        open={open}
      >

        {/* <DrawerHeader>
                  <IconButton onClick={toggleDrawer}>
                  {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                  </IconButton>
                  </DrawerHeader> */}
        {/* <Divider /> */}
        {/* Add any content you want inside the drawer */}

        <Box sx={{ marginTop: "70px" }}>
          <section id="messages__container">

            <div id="messages">
              <div className="message__wrapper">
                <div className="message__body">
                  <strong className="message__author">Sithu Soe</strong>
                  <p className="message__text">Hii Hello</p>
                </div>
              </div>
            </div>

            <form id="message__form">
              <input
                type="text"
                name="message"
                placeholder="Send a message...."
              />
            </form>
          </section>
        </Box>
      </Drawer>

    </Box >

  );
};

export default Room;

