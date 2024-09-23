import React, { useEffect, useState, useRef, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import AgoraRTM from "agora-rtm-sdk";
import { useLocation } from "react-router-dom";

// Buttons

import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";


import "../styles/room.css";
import { Button, IconButton } from "@mui/material";

const Room = () => {
  const location = useLocation();
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


  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


  const client = useRef(null);
  const rtmClient = useRef(null);
  const channel = useRef(null);
  const APP_ID = "19547e2b1603452688a040cc0a219aea";


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
        const player = `
          <div class="video__container" id="user-container-local">
            <div class="video-player" id="user-local"></div>
            <div class="video-name">${displayName} (You)</div>
            <div class="placeholder" id="placeholder-local">Camera is Off</div>
          </div>`;
        document
          .getElementById("streams__container")
          .insertAdjacentHTML("beforeend", player);
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

    // Check if the clicked element is already in the display frame
    if (displayFrame.firstChild && displayFrame.firstChild.id === clickedElement.id) {
      // Reset the display frame and resize all videos back to normal
      displayFrame.style.display = "none";

      // Move the clicked element back to its original position
      const originalContainer = document.getElementById("streams__container");
      if (clickedElement) {
        originalContainer.appendChild(clickedElement);
      }

      // Reset dimensions for all videos
      for (let i = 0; i < videoFrames.length; i++) {
        videoFrames[i].style.height = ""; // Reset height
        videoFrames[i].style.width = ""; // Reset width
      }
    } else {
      // Remove any current video in display frame
      if (displayFrame.firstChild) {
        document.getElementById("streams__container").appendChild(displayFrame.firstChild);
      }

      // Display the clicked video in full-screen
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
      if (localTracks[0]) {
        // Check the current mute status of the microphone
        const isCurrentlyMuted = localTracks[0].muted;

        // Toggle the mute status
        await localTracks[0].setMuted(!isCurrentlyMuted);

        // Update the state to reflect the new mute status
        setMicOn((prevMicOn) => !prevMicOn); // Use callback to ensure the state is updated correctly
        setBothOff((prevBothOff) => !cameraOn && !isCurrentlyMuted); // Correctly update bothOff state

        console.log(isCurrentlyMuted ? "Microphone unmuted." : "Microphone muted.");
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };


  const toggleCamera = async () => {
    try {
      if (!localTracks[1]) {
        localTracks[1] = await AgoraRTC.createCameraVideoTrack({ muted: true });
        setLocalTracks((prevTracks) => [prevTracks[0], localTracks[1]]);
      }

      const isMuted = localTracks[1].muted;
      if (isMuted) {
        await localTracks[1].setMuted(false);
        localTracks[1].play("user-local");
        const placeholder = document.getElementById("placeholder-local");
        if (placeholder) placeholder.style.display = "none";
        setCameraOn(true);
        setBothOff(!micOn && false); // Update bothOff state correctly
        console.log("Camera turned on.");
      } else {
        await localTracks[1].setMuted(true);
        localTracks[1].stop();
        const placeholder = document.getElementById("placeholder-local");
        if (placeholder) placeholder.style.display = "block";
        setCameraOn(false);
        setBothOff(!micOn && !cameraOn); // Update bothOff state correctly
        console.log("Camera turned off.");
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  };




  const toggleScreen = async () => {
    if (!sharingScreen) {
      try {
        // Create screen track for sharing
        const screenTracks = await AgoraRTC.createScreenVideoTrack();
        setLocalTracks((prevTracks) => {
          // Stop the current camera track before switching
          if (prevTracks[1]) {
            prevTracks[1].stop();
            prevTracks[1].close();
          }
          return [prevTracks[0], screenTracks];
        });

        // Unpublish the camera track and publish the screen track
        await client.current.unpublish(localTracks[1]);
        await client.current.publish([screenTracks]);
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
    <div>
      <header id="nav">
        <div className="nav--list">
          <button id="members__button">
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              fillRule="evenodd"
              clipRule="evenodd"
            >
              {/* <path d="M24 18v1h-24v-1h24zm0-6v1h-24v-1h24zm0-6v1h-24v-1h24z" fill="#ede0e0"> */}
              <path d="M24 19h-24v-1h24v1zm0-6h-24v-1h24v1zm0-6h-24v-1h24v1z" />
            </svg>
          </button>
          <a href="lobby.html">
            <h3 id="logo">
              {/* <!-- <img src="./images/logo.png" alt="Site Logo"> --> */}
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
      </header>

      <main className="container">
        <div id="room__container">
          <section id="members__container">
            <div id="members__header">
              <p>Participants</p>
              <strong id="members__count">0</strong>
            </div>

            <div id="member__list"></div>
          </section>

          <section id="stream__container">
            <div id="stream__box" ref={streamBoxRef}></div>
            {/* <div id="stream__box" onClick={myFunction()}></div> */}
            <div id="streams__container"></div>

            {/* {!joined && <button onClick={joinStream}>Join Stream</button>} */}

            {joined && (
              <div className="control-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <IconButton
                  onClick={toggleMic}
                  sx={{
                    backgroundColor: micOn ? "#845695" : "#f0f0f0", // Reflect mic state visually
                    color: micOn ? "#fff" : "#000",
                    "&:hover": {
                      backgroundColor: micOn ? "#6d477c" : "#e0e0e0",
                    },
                  }}
                >
                  {micOn ? <MicIcon /> : <MicOffIcon />}
                  {/* {micOn ? "True Unmute" : "False Mute"} */}
                </IconButton>

                <IconButton
                  onClick={toggleCamera}
                  sx={{
                    backgroundColor: cameraOn ? "#845695" : "#f0f0f0",
                    color: cameraOn ? "#fff" : "#000",
                    "&:hover": {
                      backgroundColor: cameraOn ? "#6d477c" : "#e0e0e0",
                    },
                  }}
                >
                  {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
                <IconButton
                  onClick={toggleScreen}
                  sx={{
                    backgroundColor: sharingScreen ? "#845695" : "#f0f0f0",
                    color: sharingScreen ? "#fff" : "#000",
                    "&:hover": {
                      backgroundColor: sharingScreen ? "#6d477c" : "#e0e0e0",
                    },
                  }}
                >
                  {sharingScreen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </IconButton>
                <IconButton
                  // onClick={startRecording}
                  sx={{
                    backgroundColor: "#845695",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "#6d477c",
                    },
                  }}
                >
                  <RecordVoiceOverIcon />
                </IconButton>
                <Button
                  onClick={leaveStream}
                  variant="contained"
                  sx={{
                    backgroundColor: "#845695",
                    "&:hover": {
                      backgroundColor: "#6d477c",
                    },
                  }}
                >
                  Leave
                </Button>
              </div>
            )}

            {leftMeeting && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <Button onClick={handleRejoin} variant="contained" color="error">
                  Rejoin Meeting
                </Button>
                <Button onClick={handleRejoin} variant="contained" color="success">
                  Go to Lobby
                </Button>
              </div>
            )}

          </section>



          <section id="messages__container">
            <div id="messages"></div>

            <form id="message__form">
              <input
                type="text"
                name="message"
                placeholder="Send a message...."
              />
            </form>
          </section>{" "}
        </div>
      </main>
    </div>
  );
};

export default Room;
