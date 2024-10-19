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
import { Box, Button, Drawer, IconButton, Typography, Divider, CssBaseline, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Menu, Tooltip, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import MuiAppBar from '@mui/material/AppBar';

import LeaveMeetingOverlay from '../components/LeaveMeetingOverlay';
import UserContainer from "../components/UserContainers/UserContainer";

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

  const [showLeaveOptions, setShowLeaveOptions] = useState(false);

  const [users, setUsers] = useState([]);



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



  useEffect(() => {
    console.log("Users array updated:", users);
  }, [users]);



  // 

  const [currentLink, setCurrentLink] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);


  useEffect(() => {
    // Get the current URL and replace 'room' with 'lobby'
    const url = window.location.href;
    const modifiedLink = url.replace('room', 'lobby');
    setCurrentLink(modifiedLink);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentLink)
      .then(() => {
        console.log('Link copied to clipboard!');
        setAlertVisible(true); // Show the alert when the link is copied

        // Hide the alert after 2 seconds
        setTimeout(() => {
          setAlertVisible(false);
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };



  const renderDrawerContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <Box sx={{ padding: 2, backgroundColor: '#262625', height: '100%' }}>
            <Typography variant="h6" color="white">Copy link to share with other users</Typography>
            <Typography variant="body2" color="white" sx={{ marginTop: 2, marginBottom: 1 }}>
              {currentLink}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={copyToClipboard}
              sx={{ marginTop: 1 }}
            >
              Copy Link
            </Button>

            {/* Alert for link copied confirmation */}
            {alertVisible && (
              <Alert
                severity="success"
                sx={{ marginTop: 2 }}
              >
                Link copied to clipboard!
              </Alert>
            )}
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
        alert("Failed to fetch meeting details and information because of meeting host account deleted or not exist.");
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

    console.log("RTM Hitt");

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
    console.log('RTC Init Hit');

    const init = async () => {
      try {
        // Initializing RTC client
        client.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        // Fetch meeting details, tokens, etc.
        const meetingDetails = await fetchMeetingDetails();
        const { token: rtcToken, channelName } = meetingDetails;

        console.log("User ID:", formattedUid);

        // Join the RTC channel
        await client.current.join(rtcToken, channelName, null, formattedUid);

        // Add the joined user to the set
        setJoinedUsers(prev => new Set(prev.add(formattedUid)));

        // Event listeners
        client.current.on("user-published", handleUserPublished);
        client.current.on("user-unpublished", handleUserUnpublished);
        client.current.on("user-left", handleUserLeft);
        client.current.on("user-joined", handleUserJoined);

        // Handle mute/unmute audio events
        client.current.on("mute-audio", (user) => {
          console.log(`User muted audio: ${user.uid}`);
          setUsers(prevUsers =>
            prevUsers.map(u =>
              u.uid === user.uid ? { ...u, micOn: false } : u
            )
          );
        });

        client.current.on("unmute-audio", (user) => {
          console.log(`User unmuted audio: ${user.uid}`);
          setUsers(prevUsers =>
            prevUsers.map(u =>
              u.uid === user.uid ? { ...u, micOn: true } : u
            )
          );
        });

        // Handle mute/unmute video events
        client.current.on("mute-video", (user) => {
          console.log(`User muted video: ${user.uid}`);
          setUsers(prevUsers =>
            prevUsers.map(u =>
              u.uid === user.uid ? { ...u, cameraOn: false } : u
            )
          );
        });

        client.current.on("unmute-video", (user) => {
          console.log(`User unmuted video: ${user.uid}`);
          setUsers(prevUsers =>
            prevUsers.map(u =>
              u.uid === user.uid ? { ...u, cameraOn: true } : u
            )
          );
        });

        setJoined(true);
        await joinStream();
      } catch (error) {
        console.error("Error during RTC initialization:", error);
      }
    };

    init();

    return () => {
      // Clean up on unmount
      if (client.current) {
        client.current.leave();
        client.current.off("user-published", handleUserPublished);
        client.current.off("user-unpublished", handleUserUnpublished);
        client.current.off("user-left", handleUserLeft);
        client.current.off("user-joined", handleUserJoined);
        client.current.off("mute-audio");
        client.current.off("unmute-audio");
        client.current.off("mute-video");
        client.current.off("unmute-video");
      }
    };
  }, []);





  const joinStream = async () => {
    console.log("joinStream function called.");
    console.log("micOn:", micOn, "cameraOn:", cameraOn);

    try {
      let audioTrack, videoTrack;

      if (micOn) {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      }

      if (cameraOn) {
        videoTrack = await AgoraRTC.createCameraVideoTrack();
      }

      const tracksToPublish = [audioTrack, videoTrack].filter(Boolean);

      if (tracksToPublish.length > 0) {
        await client.current.publish(tracksToPublish);
      } else {
        console.warn("No tracks to publish.");
      }

      AgoraRTC.onAutoplayFailed = () => {
        console.warn("Autoplay failed. Resuming AudioContext on user interaction.");
        document.addEventListener("click", () => {
          AgoraRTC.resumeAudioContext();
        }, { once: true });
      };

      const newUser = {
        uid: 'local', // Use a unique identifier for the local user
        displayName: displayName,
        micOn: micOn,
        cameraOn: cameraOn,
      };

      setUsers((prevUsers) => {
        // Check if the user already exists
        const userExists = prevUsers.some(user => user.uid === newUser.uid);
        if (userExists) {
          console.log("User already exists, skipping creation.");
          return prevUsers; // Return the previous state without adding the new user
        }
        return [...prevUsers, newUser]; // Add the new user if not found
      });

      console.log("Join Stream Hit");
    } catch (error) {
      console.error("Error joining stream:", error);
    }
  };



  const handleUserJoined = (user) => {
    const formattedUid = user.uid.replace(/_/g, " ");

    // Display bot message welcoming the user
    addBotMessageToDom(`Welcome to the room ${formattedUid}! 👋`);
    console.log(`User joined: ${user.uid}`);

    setUsers((prevUsers) => {
      const userExists = prevUsers.some((u) => u.uid === user.uid);

      if (userExists) {
        console.log(`User ${user.uid} already exists, updating information.`);

        return prevUsers.map((u) =>
          u.uid === user.uid
            ? {
              ...u,
              micOn: false, // Default mic state
              cameraOn: false, // Default camera state
            }
            : u
        );
      } else {
        // Add the new user
        console.log(`Adding new user ${user.uid}.`);
        const newUser = {
          uid: user.uid,
          displayName: formattedUid,
          micOn: false,
          cameraOn: false,
        };
        return [...prevUsers, newUser];
      }
    });
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

    // membersWrapper.insertAdjacentHTML("beforeend", memberItem);
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

    // Update state for user mic/camera status
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.uid === user.uid
          ? {
            ...u,
            micOn: mediaType === "audio" ? true : u.micOn,
            cameraOn: mediaType === "video" ? true : u.cameraOn,
          }
          : u
      )
    );

    try {
      await client.current.subscribe(user, mediaType);


      // If video track exists, play it
      if (mediaType === "video" && user.videoTrack) {
        user.videoTrack.play(`user-${user.uid}`);

        // Automatically expand the video when a video track is published
        const playerContainer = document.getElementById(`user-container-${user.uid}`);

        const streamBox = document.getElementById("stream__box");

        if (streamBox) {
          const computedStyle = window.getComputedStyle(streamBox);
          const displayValue = computedStyle.display;

          if (displayValue === "none") {
            console.log("stream__box is displayed as block, expanding the video frame");

            if (playerContainer) {
              expandVideoFrame({ currentTarget: playerContainer }); // Pass the screen container for expansion
            }
          } else {
            console.log("stream__box is not in block display mode");
          }
        }

      }

      // If audio track exists, play it
      if (mediaType === "audio" && user.audioTrack) {
        user.audioTrack.play();
      }
    } catch (error) {
      console.error(`Error handling user published: ${error}`);
    }
  };






  // Handle when the user stops publishing 
  const handleUserUnpublished = async (user, mediaType) => {
    console.log(`User unpublished: ${user.uid}, MediaType: ${mediaType}`);

    // Update state to reflect mic/camera off
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.uid === user.uid
          ? {
            ...u,
            micOn: mediaType === "audio" ? false : u.micOn,
            cameraOn: mediaType === "video" ? false : u.cameraOn,
          }
          : u
      )
    );

    if (mediaType === "video") {

      // Automatically expand the video when a video track is published
      const playerContainer = document.getElementById(`user-container-${user.uid}`);

      const streamBox = document.getElementById("stream__box");

      if (streamBox) {
        const computedStyle = window.getComputedStyle(streamBox);
        const displayValue = computedStyle.display;

        if (displayValue === "block") {
          console.log("stream__box is displayed as block, expanding the video frame");

          if (playerContainer) {
            expandVideoFrame({ currentTarget: playerContainer }); // Pass the screen container for expansion
          }
        } else {
          console.log("stream__box is not in block display mode");
        }
      }

      console.log(`User ${user.uid} stopped sharing video`);
    }

    if (mediaType === "audio") {
      console.log(`User ${user.uid} stopped sharing audio`);
    }
  };





  // Handle when a user leaves the meeting
  const handleUserLeft = (user) => {
    console.log(`User left: ${user.uid}`);

    // Remove the user from the users state
    setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));

    // Remove the user's video container
    // const playerContainer = document.getElementById(`user-container-${user.uid}`);
    // if (playerContainer) {
    //   playerContainer.remove();
    // }

    // Update the joined users set
    setJoinedUsers(prev => {
      prev.delete(user.uid);
      return new Set(prev);
    });
  };




  // ================ End




  // Function to expand/collapse video frames
  const expandVideoFrame = (e) => {
    const displayFrame = streamBoxRef.current;
    const clickedElement = e?.currentTarget || userIdInDisplayFrame.current; // Use fallback if event is missing

    // Check if clickedElement is a valid DOM node
    if (!clickedElement || !(clickedElement instanceof Node)) {
      console.error("Clicked element is not a valid node:", clickedElement);
      return; // Exit if not a valid node
    }

    // Check if the clicked element is already displayed
    if (displayFrame.firstChild && displayFrame.firstChild.id === clickedElement.id) {
      // Reset the display frame and resize all videos back to normal
      displayFrame.style.display = "none";
      setIsExpanded(false);

      const originalContainer = document.getElementById("streams__container");
      // Reattach the clickedElement back to the original container if needed
      if (clickedElement && originalContainer && !originalContainer.contains(clickedElement)) {
        originalContainer.appendChild(clickedElement);
      }
      console.log("Not Expanded");

      // Reset dimensions for all videos
      Array.from(document.getElementsByClassName("video__container")).forEach(videoFrame => {
        videoFrame.style.height = ""; // Reset height
        videoFrame.style.width = ""; // Reset width
      });

    } else {
      // Check if the display frame already has a video
      if (displayFrame.firstChild) {
        console.log("Video is already expanded. Click to view is disabled.");
        return; // Exit if a video is already expanded
      }

      console.log("Expanded");
      setIsExpanded(true);

      // Display the clicked video in expanded mode
      displayFrame.style.display = "block";
      displayFrame.appendChild(clickedElement); // Append only if valid
      userIdInDisplayFrame.current = clickedElement.id;

      // Resize other videos to small size
      Array.from(document.getElementsByClassName("video__container")).forEach(videoFrame => {
        if (videoFrame.id !== userIdInDisplayFrame.current) {
          videoFrame.style.height = "100px";
          videoFrame.style.width = "100px";
        }
      });
    }
  };


  const toggleFullscreen = (e) => {
    const displayFrame = streamBoxRef.current;

    // Store the current video element being expanded for use when exiting fullscreen
    const clickedElement = e?.currentTarget || userIdInDisplayFrame.current;

    if (!document.fullscreenElement) {
      // Enter fullscreen
      setIsFullscreen(true);
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
      setIsFullscreen(false);
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          // Reset to small view after exiting fullscreen
          if (clickedElement) {
            expandVideoFrame({ currentTarget: clickedElement });
          }
        });
      } else if (document.mozCancelFullScreen) { // For Firefox
        document.mozCancelFullScreen().then(() => {
          if (clickedElement) {
            expandVideoFrame({ currentTarget: clickedElement });
          }
        });
      } else if (document.webkitExitFullscreen) { // For Chrome, Safari, and Opera
        document.webkitExitFullscreen().then(() => {
          if (clickedElement) {
            expandVideoFrame({ currentTarget: clickedElement });
          }
        });
      } else if (document.msExitFullscreen) { // For IE/Edge
        document.msExitFullscreen().then(() => {
          if (clickedElement) {
            expandVideoFrame({ currentTarget: clickedElement });
          }
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

        // Update mic state for the local user
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.uid === 'local' ? { ...user, micOn: false } : user
          )
        );
        console.log("Microphone disabled.");
      } else {
        // If the mic is off, create a new microphone audio track
        const newAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalTracks((prevTracks) => [newAudioTrack, prevTracks[1]]);
        await client.current.publish([newAudioTrack]);
        setMicOn(true);

        // Update mic state for the local user
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.uid === 'local' ? { ...user, micOn: true } : user
          )
        );
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

        if (!sharingScreen) {
          await client.current.publish([localTracks[1]]); // Publish the video track
          localTracks[1].play("user-local"); // Play the local video
        }

        setCameraOn(true);
        setBothOff(!micOn && false);

        // Update camera state for the local user
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.uid === 'local' ? { ...user, cameraOn: true } : user
          )
        );
        console.log("Camera turned on.");
      } else {
        // Camera is on, so we turn it off
        if (localTracks[1]) {
          localTracks[1].stop();
          await client.current.unpublish([localTracks[1]]);
          localTracks[1].close();
          localTracks[1] = null;
        }

        setCameraOn(false);
        setBothOff(!micOn && true);

        // Update camera state for the local user
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.uid === 'local' ? { ...user, cameraOn: false } : user
          )
        );
        console.log("Camera turned off.");
      }
    } catch (error) {
      console.error("Error toggling the camera: ", error);
    }
  };



  const toggleScreen = async () => {
    if (!sharingScreen) {
      try {
        // Try to create a screen track for sharing
        const screenTracks = await AgoraRTC.createScreenVideoTrack().catch(error => {
          if (error.name === 'NotAllowedError') {
            console.log('Screen sharing was canceled by the user:', error);
            setSharingScreen(false); // Reset screen sharing state
            return null; // Handle the case where the user cancels screen sharing
          } else {
            throw error; // If it's a different error, rethrow it
          }
        });

        // If the user cancels, screenTracks will be null, so return early
        if (!screenTracks) return; // Exit the function early if screen sharing was canceled

        // Listen for the event when the screen share is stopped by the browser
        screenTracks.on('track-ended', async () => {
          console.log('Screen sharing stopped by the user via the browser.');

          // Stop the screen track and unpublish it
          screenTracks.stop(); // Stop screen capture in the browser
          await client.current.unpublish([screenTracks]); // Unpublish the screen track

          // Reset the screen sharing state
          setSharingScreen(false);

          // Optionally, switch back to the camera if the camera was on
          if (cameraOn) {
            const cameraTrack = await AgoraRTC.createCameraVideoTrack();
            setLocalTracks((prevTracks) => [prevTracks[0], cameraTrack]);

            await client.current.publish([cameraTrack]); // Re-publish the camera track
            cameraTrack.play("user-local");
          }

          // Collapse the expanded screen once sharing stops
          setIsExpanded(false);
        });

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

        // Automatically expand the screen share to full size when sharing starts
        let screenContainer = document.getElementById("user-container-local");
        if (!screenContainer) {
          const screenPlayer = `
            <div class="video__container" id="user-container-local">
              <div class="video-player" id="user-local"></div>
            </div>`;
          document.getElementById("streams__container").insertAdjacentHTML("beforeend", screenPlayer);
        }
        screenTracks.play("user-local");

        // Trigger the expandVideoFrame function to expand the screen share video
        const displayFrame = streamBoxRef.current; // Reference the stream container

        if (!isExpanded) {
          const screenElement = document.getElementById("user-container-local");
          expandVideoFrame({ currentTarget: screenElement }); // Pass the screen container for expansion
        }

      } catch (error) {
        console.error("Error starting screen share:", error);
      }
    } else {
      try {
        // Stop screen sharing and switch back to the camera
        localTracks[1].stop(); // Stop sending screen frames
        await client.current.unpublish([localTracks[1]]); // Unpublish the screen track
        localTracks[1].close(); // Close the track and stop screen sharing

        if (cameraOn) {
          // Recreate the camera track
          const cameraTrack = await AgoraRTC.createCameraVideoTrack();
          setLocalTracks((prevTracks) => [prevTracks[0], cameraTrack]);

          // Publish the camera track again
          await client.current.publish([cameraTrack]);
          cameraTrack.play("user-local");
        }

        // Collapse the expanded screen once screen sharing is stopped
        setIsExpanded(false);
        setSharingScreen(false);

        if (isExpanded) {
          const screenElement = document.getElementById("user-container-local");
          expandVideoFrame({ currentTarget: screenElement }); // Pass the screen container for expansion
        }

      } catch (error) {
        console.error("Error stopping screen share:", error);
      }
    }
  };




  // Navigate to the lobby URL with meeting GUID
  const navigateToLobby = (meetingGuid) => {
    window.location.href = `/lobby?room=${meetingGuid}`;
  };



  // Function to rejoin the meeting
  const rejoinMeeting = async () => {
    window.location.reload();
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
      setLeftMeeting(true); // Set flag to display rejoin/lobby buttons

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
              // backgroundColor: 'black', // Example background to separate it visually
              padding: '16px',
              position: 'fixed', // Fix it at the top/bottom or as required
              bottom: 0, // If you want it at the bottom
              width: '100%',
              zIndex: 1000, // Ensure it's above other elements
              borderTop: '1px solid #444', // Optional: Add a border to separate it visually
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

            <Tooltip title="Recording Coming Soon">
              <GradientIconButton>
                <RecordIcon />
              </GradientIconButton>
            </Tooltip>

            {/*  */}

            {/* Buttons for selecting tabs */}
            <GradientIconButton onClick={() => handleTabChange('info')} isSelected={activeTab === 'info'}>
              {activeTab === 'info' && open ? <InfoIcon /> : <InfoIcon />}
            </GradientIconButton>

            {/* <GradientIconButton onClick={() => handleTabChange('people')} isSelected={activeTab === 'people'}>
              {activeTab === 'people' && open ? <PeopleAltIcon /> : <PeopleIcon />}
            </GradientIconButton> */}

            <GradientIconButton onClick={() => handleTabChange('chat')} isSelected={activeTab === 'chat'}>
              {activeTab === 'chat' && open ? <ChatOffIcon /> : <ChatIcon />}
            </GradientIconButton>









            <Button onClick={leaveStream} variant="contained" color="error">
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


            <div id="streams__container">
              {users.map(user => (
                <UserContainer
                  key={user.uid}
                  uid={user.uid}
                  displayName={user.displayName}
                  micOn={user.micOn}
                  cameraOn={user.cameraOn}
                  onClick={expandVideoFrame} // Ensure this function is properly bound
                />

              ))}
            </div>



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


      {leftMeeting && (
        <LeaveMeetingOverlay
          meetingGuid={meetingGuid}
          onRejoin={rejoinMeeting}
          onNavigateToLobby={navigateToLobby}
        />
      )}


    </Box >

  );
};

export default Room;

