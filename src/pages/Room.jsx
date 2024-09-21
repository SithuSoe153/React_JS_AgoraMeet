import React, { useEffect, useState, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import AgoraRTM from "agora-rtm-sdk";
import { useLocation } from "react-router-dom";

import "../styles/room.css";

const Room = () => {
  const location = useLocation();
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
  const [sharingScreen, setSharingScreen] = useState(false);

  console.log("cameraa", cameraOn);



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

      // Log fetched rtcToken and channelName
      console.log("Tester", rtcToken, channelName);

      // Join the RTC channel
      await client.current.join(rtcToken, channelName, null, uid);

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
      // Create microphone and camera tracks
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks(tracks);

      // Create local player container if it doesn't already exist
      let playerContainer = document.getElementById('user-container-local');
      if (!playerContainer) {
        let player = `
          <div class="video__container" id="user-container-local">
            <div class="video-player" id="user-local"></div>
            <div class="video-name">Users</div>

          </div>`;
        document.getElementById("streams__container").insertAdjacentHTML("beforeend", player);
      }

      // Play local video track
      tracks[1].play("user-local");

      // Publish local tracks to the client
      await client.current.publish(tracks);
      console.log("Local tracks published:", tracks);
    } catch (error) {
      console.error("Error joining stream:", error);
    }
  };


  const handleUserPublished = async (user, mediaType) => {
    console.log("user", user);


    console.log(`User published: ${user.uid}, MediaType: ${mediaType}`);
    await client.current.subscribe(user, mediaType).catch(console.error);

    if (mediaType === "video") {
      let playerContainer = document.getElementById(`user-container-${user.uid}`);
      if (!playerContainer) {
        let player = `
          <div class="video__container" id="user-container-${user.uid}">
            <div class="video-player" id="user-${user.uid}"></div>
            <div class="video-name">Users</div>
          </div>`;

        // let player = `
        //   <h1>Tester</h1>
        //   <div class="video__container" id="user-container-${user.uid}">
        //     <div class="video-player" id="user-${user.uid}"></div>
        //     <div class="video-name">${user.uid?.replace(/_/g, " ")}</div>
        //   </div>`;

        document.getElementById("streams__container").insertAdjacentHTML("beforeend", player);
      }

      user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === "audio") {
      user.audioTrack.play();
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
        await localTracks[0].setMuted(!micOn);
        setMicOn((prev) => !prev);
      }
    } catch (error) {
      console.error("Error toggling mic:", error);
    }
  };

  const toggleCamera = async () => {
    try {
      if (localTracks[1]) {
        await localTracks[1].setMuted(!cameraOn);
        setCameraOn((prev) => !prev);
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
            <div id="stream__box"></div>
            <div id="streams__container"></div>
            <div className="stream__actions">
              <button id="camera-btn" className="active">
                Camera
              </button>
              <button id="mic-btn" className="active">
                Mic
              </button>
              <button id="screen-btn">Screen</button>
              <button id="leave-btn" style={{ backgroundColor: "#FF5050" }}>
                Leave
              </button>
            </div>

            {!joined && <button onClick={joinStream}>Join Stream</button>}

            {joined && (
              <div className="control-buttons">
                <button onClick={toggleMic}>
                  {micOn ? "Mute Mic" : "Unmute Mic"}
                </button>
                <button onClick={toggleCamera}>
                  {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
                </button>
                <button onClick={toggleScreen}>
                  {sharingScreen ? "Stop Screen Share" : "Start Screen Share"}
                </button>
                <button onClick={leaveStream}>Leave</button>
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
