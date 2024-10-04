import React, { useEffect, useState, useRef, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
// import AgoraRTM from "agora-rtm-sdk";
import { useLocation, useNavigate } from "react-router-dom";

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
import { Box, Button, Drawer, IconButton, Typography, Divider, CssBaseline, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Menu, Tooltip } from "@mui/material";
import MuiAppBar from '@mui/material/AppBar';

const appId = '19547e2b1603452688a040cc0a219aea';
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

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-start',
}));


const Room = () => {
  const navigate = useNavigate();
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

  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  // const [micOn, setMicOn] = useState(prevMicOn);
  // const [cameraOn, setCameraOn] = useState(prevCameraOn);
  const [bothOff, setBothOff] = useState(!micOn && !cameraOn); // Track if both are off

  const [sharingScreen, setSharingScreen] = useState(false);

  const [leftMeeting, setLeftMeeting] = useState(false); // New state for tracking if user left

  const [fullscreen, setFullscreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [activeTab, setActiveTab] = useState(''); // Track the active tab, initially empty

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [rtmClient, setRtmClient] = useState(null);
  const [channel, setChannel] = useState(null);

  const [open, setOpen] = useState(false);


  const [members, setMembers] = useState([]);



  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };


  // const drawerWidth = 400;



  // Fetch RTM token
  const getRtmToken = async (chatUserName) => {
    try {
      const response = await fetch(
        `https://dev.gigagates.com/social-commerce-backend/v1/agora/generateRtmToken?userId=${chatUserName}&expirationInSeconds=86400000`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const rtmToken = await response.text();
      if (response.ok) {
        console.log('RTM token:', rtmToken);

        return rtmToken;
      } else {
        console.error('Failed to fetch RTM token:', response);
        return null;
      }
    } catch (error) {
      console.error('Error fetching RTM token:', error);
      return null;
    }
  };


  let addBotMessageToDom = (botMessage) => {
    // Select only the messages section for chat
    let messagesWrapper = document.querySelector("#chat_messages");

    // Return early if there's no valid chat section
    if (!messagesWrapper) return;

    let newMessage = `
      <div class="message__wrapper">
        <div class="message__body__bot">
          <strong class="message__author__bot">🤖 Meet.MyDay Bot</strong>
          <p class="message__text__bot">${botMessage}</p>
        </div>
      </div>`;

    messagesWrapper.insertAdjacentHTML("beforeend", newMessage);

    let lastMessage = document.querySelector("#chat_messages .message__wrapper:last-child");
    if (lastMessage) {
      lastMessage.scrollIntoView();
    }
  };






  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


  const client = useRef(null);
  const APP_ID = "19547e2b1603452688a040cc0a219aea";




  const handleTabChange = (tab) => {
    if (activeTab === tab && open) {
      // If the same tab is clicked again, close the drawer and deactivate the icon
      setOpen(false);
      setActiveTab(''); // Reset activeTab to deactivate the icon
    } else {
      // If a different tab or drawer is closed, open it and set the new active tab
      setActiveTab(tab);
      setOpen(true);
    }
  };



  const sendMessage = async (e) => {
    e.preventDefault();
    if (messageText.trim() && channel) {
      await channel.sendMessage({ text: messageText });
      setMessages((prevMessages) => [...prevMessages, { text: messageText, senderId: 'You' }]);
      setMessageText('');
    }
  };



  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     // Check if the click is outside the drawer and not on any of the tab icons
  //     if (
  //       open &&
  //       !event.target.closest('.MuiDrawer-paper') && 
  //       !event.target.closest('.drawer-toggle-icon') // Avoid closing if an icon is clicked
  //     ) {
  //       setOpen(false);
  //       setActiveTab(''); // Reset activeTab when closing drawer
  //     }
  //   };

  //   if (open) {
  //     document.addEventListener('mousedown', handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [open]);


  useEffect(() => {
    // Scroll to the latest message when the messages array is updated
    const lastMessage = document.querySelector("#messages .message__wrapper:last-child");
    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // The effect runs every time 'messages' changes


  const renderDrawerContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <Box>
            <Typography variant="h6" color="white">Information</Typography>
            <Typography variant="body2" color="white">
              Display info-related content.
            </Typography>
          </Box>
        );
      case 'people':
        return (
          <Box>
            <section id="members__container">
              <div id="member__list"></div>
            </section>
          </Box>
        );
      case 'chat':
      default:
        return (
          <Box>
            <section id="messages__container">
              <div id="chat_messages"> {/* Changed ID here */}
                {messages.map((msg, index) => (
                  <div key={index} className="message__wrapper">
                    <div className="message__body">
                      <strong className="message__author">{msg.senderId}</strong>
                      <p className="message__text">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form id="message__form" onSubmit={sendMessage}>
                <input
                  type="text"
                  name="message"
                  placeholder="Send a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
              </form>
            </section>
          </Box>
        );

    }
  };





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
      Navigate("/lobby")
      // alert("An error occurred while fetching meeting details and information.");
    }
  };



  // ================ Start


  // Keep track of joined users
  const [joinedUsers, setJoinedUsers] = useState(new Set());



  // Initialize RTM when component mounts
  useEffect(() => {

    const initRTM = async () => {

      const chatUserName = displayName; // Replace with the actual user name
      const token = await getRtmToken(chatUserName);

      if (!token) {
        console.error('RTM token is missing.');
        return;
      }

      // Access AgoraRTM from window object
      const client = window.AgoraRTM.createInstance(appId);
      await client.login({ token, uid: chatUserName });
      setRtmClient(client);

      const rtmChannel = client.createChannel('general');
      await rtmChannel.join();
      setChannel(rtmChannel);

      rtmChannel.on('ChannelMessage', ({ text }, senderId) => {
        setMessages((prevMessages) => [...prevMessages, { text, senderId }]);
      });
    };

    initRTM();


    // Cleanup on unmount
    return () => {
      if (channel) {
        channel.leave();
      }
      if (rtmClient) {
        rtmClient.logout();
      }
    };
  }, []);





  useEffect(() => {
    const init = async () => {
      // Initializing RTC client
      client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // Fetch meeting details, tokens, etc.
      const meetingDetails = await fetchMeetingDetails();
      const { token: rtcToken, channelName } = meetingDetails;

      // Join the RTC channel
      await client.current.join(rtcToken, channelName, null, formattedUid);

      // Add the joined user to the set
      setJoinedUsers(prev => new Set(prev.add(formattedUid)));

      // Event listeners
      client.current.on("user-published", handleUserPublished);
      client.current.on("user-left", handleUserLeft);

      // Listen for users joining (without media published)
      client.current.on("user-joined", handleUserJoined);

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


  const joinStream = async () => {
    console.log("joinStream function called."); // Check if function is called
    console.log("micOn:", micOn, "cameraOn:", cameraOn); // Check mic and camera states

    try {
      let audioTrack, videoTrack;

      // Create audio track only if mic is on
      if (micOn) {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      }

      // Create video track only if camera is on
      if (cameraOn) {
        videoTrack = await AgoraRTC.createCameraVideoTrack();
      }

      const tracksToPublish = [];
      if (audioTrack) {
        tracksToPublish.push(audioTrack);
      }
      if (videoTrack) {
        tracksToPublish.push(videoTrack);
      }

      // Only publish if there are tracks to publish
      if (tracksToPublish.length > 0) {
        await client.current.publish(tracksToPublish);
      } else {
        console.warn("No tracks to publish."); // This will trigger since both are off
      }

      // Check if the user container already exists for the local user
      const playerId = `user-container-local`;
      const existingPlayer = document.getElementById(playerId);

      if (existingPlayer) {
        console.log("Local user container already exists. Skipping creation.");
      } else {
        // Always create the user container if it doesn't exist
        const player = document.createElement("div");
        player.className = "video__container";
        player.id = playerId;
        player.onclick = (e) => {
          expandVideoFrame(e);
        };

        // Display the user's name and the state
        player.innerHTML = `
          <div class="video-player" id="user-local"></div>
          <div class="video-name">${displayName} (You)</div>
          <div class="placeholder" id="placeholder-local">${!micOn && !cameraOn ? "User is in the meeting without audio and video" : "Loading..."}</div>
        `;

        // Append player container to streams container
        document.getElementById("streams__container").appendChild(player);
        console.log("Local user container created.");
      }

      const placeholder = document.getElementById("placeholder-local");
      const localContainer = document.getElementById("user-container-local");
      localContainer.style.display = "block"; // Make sure the container is visible

      // Handle mic and camera state after publishing
      if (!micOn && audioTrack) {
        await client.current.unpublish(audioTrack);
        audioTrack.stop();
        audioTrack.close();
      }

      if (!cameraOn && videoTrack) {
        await client.current.unpublish(videoTrack);
        videoTrack.stop();
        videoTrack.close();
        placeholder.style.display = "block"; // Show placeholder when camera is off
      } else if (videoTrack) {
        videoTrack.play("user-local");
        placeholder.style.display = "none"; // Hide placeholder if video is available
      }

    } catch (error) {
      console.error("Error joining stream:", error);
    }
  };



  const handleUserJoined = async (user) => {
    let formattedUid = user.uid.replace(/_/g, " ");

    // Display bot message welcoming the user
    addBotMessageToDom(`Welcome to the room ${formattedUid}! 👋`);
    console.log(`User joined: ${user.uid}`);

    // Create the user container when they join, even if they haven't published any media yet
    createUserContainer(user.uid);

    // Optionally, display a message to indicate that the user hasn't published any tracks yet
    const placeholder = document.getElementById(`placeholder-${user.uid}`);
    placeholder.innerText = "User has joined without audio and video"; // Default message
    placeholder.style.display = "block"; // Show the placeholder

    // Add member to DOM
    if (activeTab === 'people' && open) {
    }
    await addMemberToDom(user.uid);
    // Get the members in the channel and update the total member count
    // let members = await channel.getMembers();
    // updateMemberTotal(members);    

  };


  let addMemberToDom = async (MemberId) => {

    let formattedUid = MemberId.replace(/_/g, " ");
    let name = formattedUid || MemberId; // Fallback to MemberId if name is undefined

    if (name === undefined) {
      console.warn(`Name attribute is not defined for user: ${MemberId}`);
    }

    let membersWrapper = document.getElementById("member__list");
    let memberItem = `
      <div class="member__wrapper" id="member__${MemberId}__wrapper">
        <span class="green__icon"></span>
        <p class="member_name">${name}</p>
      </div>`;

    membersWrapper.insertAdjacentHTML("beforeend", memberItem);
  };


  let updateMemberTotal = async (members) => {
    let total = document.getElementById("members__count");
    total.innerText = members.length;
  };


  let getMembers = async () => {
    let members = await channel.getMembers();
    updateMemberTotal(members);
    for (let i = 0; members.length > i; i++) {
      addMemberToDom(members[i]);
    }
  };




  const handleUserPublished = async (user, mediaType) => {
    console.log(`User published: ${user.uid}, MediaType: ${mediaType}`);

    const playerId = `user-container-${user.uid}`;

    // Check if the user container already exists
    let playerContainer = document.getElementById(playerId);
    if (!playerContainer) {
      // Create the container if it doesn't exist
      createUserContainer(user.uid);
    } else {
      console.log(`Container for user ${user.uid} already exists.`);
    }

    try {
      await client.current.subscribe(user, mediaType);
      const placeholder = document.getElementById(`placeholder-${user.uid}`);

      const hasVideoTrack = mediaType === "video" && user.videoTrack;
      const hasAudioTrack = mediaType === "audio" && user.audioTrack;

      // Check if both audio and video tracks are missing
      if (!hasAudioTrack && !hasVideoTrack) {
        placeholder.innerText = "Camera and Mic are Off"; // Show message when both are off
        placeholder.style.display = "block"; // Show the placeholder
      } else {
        placeholder.style.display = "none"; // Hide placeholder once the user publishes any track
      }

      // Play video track if it exists
      if (hasVideoTrack) {
        user.videoTrack.play(`user-${user.uid}`);
      }

      // Play audio track if it exists
      if (hasAudioTrack) {
        user.audioTrack.play();
      }

    } catch (error) {
      console.error(`Error handling user published: ${error}`);
    }
  };



  // Function to create user container
  const createUserContainer = (uid) => {
    const playerId = `user-container-${uid}`;

    // Check again here if the container exists before creating
    if (document.getElementById(playerId)) {
      console.log(`User container for ${uid} already exists, skipping creation.`);
      return; // Skip creating if it already exists
    }

    const player = document.createElement("div");
    player.className = "video__container";
    player.id = playerId;
    player.onclick = expandVideoFrame;

    // Initial message for the user
    player.innerHTML = `
    <div class="video-player" id="user-${uid}"></div>
    <div class="video-name">${uid.replace(/_/g, " ")}</div>
    <div class="placeholder" id="placeholder-${uid}" style="display: block;">Camera and Mic are Off</div>
  `;

    document.getElementById("streams__container").appendChild(player);
    console.log("User container created.");
  };



  const handleUserLeft = (user) => {
    console.log(`User left: ${user.uid}`);
    const playerContainer = document.getElementById(`user-container-${user.uid}`);
    if (playerContainer) {
      playerContainer.remove();
    }

    // Update the joined users set
    setJoinedUsers(prev => {
      prev.delete(user.uid);
      return new Set(prev);
    });
  };



  // ================ End



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
        setIsExpanded(false)
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
          // setIsExpanded(true)

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


      const videoContainers = document.getElementsByClassName("video__container");
      for (let container of videoContainers) {
        container.onclick = toggleFullscreen;
      }

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

      const videoContainers = document.getElementsByClassName("video__container");
      for (let container of videoContainers) {
        container.onclick = expandVideoFrame;
      }

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

  // const handleUserLeft = (user) => {
  //   console.log("User Left");

  //   delete remoteUsers[user.uid];
  //   let item = document.getElementById(`user-container-${user.uid}`);
  //   if (item) {
  //     item.remove();
  //   }
  // };



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

            <Tooltip title="Coming Soon">
              <GradientIconButton>
                <RecordIcon />
              </GradientIconButton>
            </Tooltip>

            {/*  */}

            {/* Buttons for selecting tabs */}
            <GradientIconButton onClick={() => handleTabChange('info')} isSelected={activeTab === 'info'}>
              {activeTab === 'info' && open ? <InfoIcon /> : <InfoIcon />}
            </GradientIconButton>

            <GradientIconButton onClick={() => handleTabChange('people')} isSelected={activeTab === 'people'}>
              {activeTab === 'people' && open ? <PeopleAltIcon /> : <PeopleIcon />}
            </GradientIconButton>

            <GradientIconButton onClick={() => handleTabChange('chat')} isSelected={activeTab === 'chat'}>
              {activeTab === 'chat' && open ? <ChatOffIcon /> : <ChatIcon />}
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

              {isExpanded && ( // Show fullscreen button only in expanded mode
                <div className="fullscreen-btn-container">
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
              )}

            </div>


            <div id="streams__container"></div>
          </div>
        </main>
      </Main>


      {/* Drawer Component */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            backgroundColor: '#262625',
          },
        }}
        variant="persistent"
        anchor="right"
        open={open}
      >
        <DrawerHeader sx={{ backgroundColor: '#262625', position: 'sticky', top: 0, zIndex: 1 }}>
          <IconButton onClick={() => { setOpen(false); setActiveTab(''); }} sx={{ color: "#fff" }}>
            {theme.direction === 'rtl' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
          <Typography variant="h6" color="white">
            {activeTab === 'chat' ? 'In-app Messages' : activeTab === 'info' ? 'Information' : 'Participants'}
          </Typography>
        </DrawerHeader>
        <Divider />

        {/* Drawer Content Based on Active Tab */}
        <Box sx={{ width: '100%', backgroundColor: '#797a79', height: "100%" }}>
          {renderDrawerContent()}
        </Box>

      </Drawer>


    </Box >

  );
};

export default Room;

