const APP_ID = "69b5921596cd4632a94ead5fe6706777";
const API_BASE_URL = "https://dev.gigagates.com/social-commerce-backend/v1";

let uid = sessionStorage.getItem("display_name");
let chatUserName = sessionStorage.getItem("chat_user_name");

let channelName;
let rtcToken;
let groupId;

let client;

let rtmClient;
let localTracks = [];
let remoteUsers = {};

let localScreenTracks;
let sharingScreen = false;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");
let meetingGuid = urlParams.get("room");

const getRoomDetails = async (groupId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/chat/room/details/${groupId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("Response data room details:", data);
  } catch (error) {
    alert("Failed to fetch room details.");
  }
};

async function fetchMeetingDetails() {
  try {
    const response = await fetch(
      // `${API_BASE_URL}/chat/room/list?chatRoomGuid=${meetingGuid}`,
      `${API_BASE_URL}/chat/room/list?chatRoomGuid=d48e58a2-8d30-4ea8-952f-ca3003f2d32d`,
      {
        method: "GET",
      }
    );

    const data = await response.json();

    console.log("Response data meeting details:", data);

    if (response.ok && data && data.data) {
      rtcToken = data.data.token;
      channelName = data.data.channelName;
      groupId = data.data.groupId;
      console.log("fetch groupid: ", groupId);

      return { rtcToken, channelName, groupId };
    } else {
      console.error("Failed to fetch meeting details:", data);
      alert("Failed to fetch meeting details and information.");
    }
  } catch (error) {
    console.error("Error fetching meeting details:", error);
    alert("An error occurred while fetching meeting details and information.");
  }
}

if (!roomId) {
  roomId = "main";
}

let displayName = sessionStorage.getItem("display_name");
if (!displayName && !roomId) {
  window.location = "lobby.html";
  alert("Please login first");
}

// let joinRoomInit = async () => {
//   client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

//   const meetingDetails = await fetchMeetingDetails();
//   const clientToken = meetingDetails.rtcToken;
//   const clientChannelName = meetingDetails.channelName;

//   // await client.join(APP_ID, clientChannelName, clientToken, uid);
//   await client.join(clientToken, clientChannelName, null, uid);

//   client.on("user-published", handleUserPublished);
//   client.on("user-left", handleUserLeft);
// };

// Message Start

async function getRtmToken(chatUserName) {
  const USERNAME = "b0994be0912d4f0ca681f9c9889b8111";
  const PASSWORD = "6a310fd721ce410ca7c15ef71aa88aff";

  const url =
    "https://dev.gigagates.com/qq_backend_agora/v1/agora/generateRtmToken?userId=tester112&expirationInSeconds=86400000";

  try {
    const response = await fetch(
      "https://dev.gigagates.com/qq_backend_agora/v1/agora/generateRtmToken?userId=tester112&expirationInSeconds=86400000",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(`${USERNAME}:${PASSWORD}`),
        },
      }
    );

    const data = await response.json();
    console.log("check1: ");

    if (response.ok) {
      console.log("check2: ");
      return data.token; // Adjust according to the actual response structure
    } else {
      console.error("Failed to fetch RTM token:", data);
      alert("Okay Okay check ");
      return null;
    }
  } catch (error) {
    console.error("Error fetching RTM token:", error);
    alert("Okay Okay Noo ", error);
    return null;
  }
}

const addUserToChatRoom = async (
  channelName,
  groupId,
  chatUserName,
  status = true
) => {
  const url = `${API_BASE_URL}/chat/room/user/token?channelName=${channelName}&groupId=${groupId}&chatUserName=${chatUserName}&status=${status}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Fetched user add to room data:", data);
  } catch (error) {
    console.error("Error fetching user token:", error);
    alert("An error occurred while fetching the user add to room data.");
  }
};

const sendMessageToRoom = async (message, from, to) => {
  const body = {
    from: from,
    to: [to],
    type: "txt",
    body: {
      msg: message,
    },
  };

  try {
    const response = await fetch(
      "https://dev.gigagates.com/social-commerce-backend/v1/chat/room/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("Message sent successfully:", data);
    } else {
      console.error("Failed to send message:", data);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

let sendMessage = async (e) => {
  e.preventDefault();

  let message = e.target.message.value;
  const from = chatUserName;
  const to = groupId;

  // Call the updated send message function
  await sendMessageToRoom(message, from, to);

  addMessageToDom(from, message);

  e.target.reset();
};

// Function to handle incoming messages in the channel
let handleChannelMessage = async (messageData, MemberId) => {
  console.log("A new message was received");
  let data;
  try {
    data = JSON.parse(messageData.text);
  } catch (error) {
    console.error("Failed to parse incoming message data:", error);
    return;
  }

  // Display chat messages
  if (data.type === "chat") {
    addMessageToDom(data.displayName || MemberId, data.message);
  }

  // Handle when a user leaves
  if (data.type === "user_left") {
    let userContainer = document.getElementById(`user-container-${data.uid}`);
    if (userContainer) {
      userContainer.remove();
    }

    if (userIdInDisplayFrame === `user-container-${uid}`) {
      displayFrame.style.display = null;

      for (let i = 0; i < videoFrames.length; i++) {
        videoFrames[i].style.height = "300px";
        videoFrames[i].style.width = "300px";
      }
    }
  }
};

let addMessageToDom = (name, message) => {
  let messagesWrapper = document.getElementById("messages");

  let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`;

  messagesWrapper.insertAdjacentHTML("beforeend", newMessage);

  let lastMessage = document.querySelector(
    "#messages .message__wrapper:last-child"
  );
  if (lastMessage) {
    lastMessage.scrollIntoView();
  }
};

async function sendWelcomeMessage(username, groupId) {
  const messagePayload = {
    from: username,
    to: [groupId],
    type: "txt",
    body: {
      msg: `Hello everyone, ${username} has joined!`, // Welcome messages
    },
  };

  try {
    const response = await fetch(
      "https://dev.gigagates.com/social-commerce-backend/v1/chat/room/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const data = await response.json();
    console.log("Response data welcome message: ", data);

    if (response.ok) {
      console.log("Welcome message sent successfully.");
    } else {
      console.error("Failed to send welcome message.");
    }
  } catch (error) {
    console.error("Error sending welcome message:", error);
  }
}

// Message End

async function joinRoomInit() {
  const meetingDetails = await fetchMeetingDetails();
  const clientToken = meetingDetails.rtcToken;
  const clientChannelName = meetingDetails.channelName;

  // RTM Start
  rtmClient = await AgoraRTM.createInstance(APP_ID);

  // Define the RTM User ID and Token
  const rtmUser = "tester112"; // Make sure this matches Agora's user ID requirements
  const rtmToken =
    "00619547e2b1603452688a040cc0a219aeaIAD/riXSsBwRreqX4pHGAvDNHwjzoZ4jX0AVI6pTAcOH4XbkuSUAAAAAEAB689sds9vRZgEA6AMz5vZr"; // Ensure this token is correct and not expired

  // Attempt to login with RTM Client
  try {
    await rtmClient.login({ token: rtmToken, uid: rtmUser });
    console.log("RTM Client logged in successfully.");
  } catch (error) {
    console.error("RTM login failed:", error);
    alert("RTM login failed. Please check your user ID and token.");
    return; // Exit if login fails
  }

  // Create and join the channel
  const channel = rtmClient.createChannel(channelName);
  try {
    await channel.join();
    console.log("Joined RTM channel successfully.");
  } catch (error) {
    console.error("Failed to join RTM channel:", error);
    alert("Failed to join the RTM channel.");
  }

  // Set up message handler for the channel
  channel.on("ChannelMessage", handleChannelMessage);

  // RTM End

  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  // await client.join(APP_ID, clientChannelName, clientToken, uid);
  await client.join(clientToken, clientChannelName, null, uid);

  client.on("user-published", handleUserPublished);
  client.on("user-left", handleUserLeft);

  await fetchMeetingDetails();
  await getRoomDetails(groupId);
  await addUserToChatRoom(channelName, groupId, chatUserName);

  await sendWelcomeMessage(chatUserName, groupId);

  await getRtmToken(chatUserName);

  console.log(
    "channel: ",
    channelName,
    "groupId: ",
    groupId,
    "chatUserName: ",
    chatUserName
  );
}

let joinStream = async () => {
  document.getElementById("join-btn").style.display = "none";
  document.getElementsByClassName("stream__actions")[0].style.display = "flex";

  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`;

  document
    .getElementById("streams__container")
    .insertAdjacentHTML("beforeend", player);
  document
    .getElementById(`user-container-${uid}`)
    .addEventListener("click", expandVideoFrame);

  localTracks[1].play(`user-${uid}`);
  await client.publish(localTracks);
};

let switchToCamera = async () => {
  let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`;
  document
    .getElementById("streams__container")
    .insertAdjacentHTML("beforeend", player);

  localTracks[1].play(`user-${uid}`);
  await client.publish(localTracks);
};

let handleUserPublished = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);

  if (mediaType === "video") {
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player === null) {
      player = `<div class="video__container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div>
                      </div>`;
      document
        .getElementById("streams__container")
        .insertAdjacentHTML("beforeend", player);
      document
        .getElementById(`user-container-${user.uid}`)
        .addEventListener("click", expandVideoFrame);
    }
    user.videoTrack.play(`user-${user.uid}`);
  }

  if (mediaType === "audio") {
    user.audioTrack.play();
  }
};

let handleUserLeft = async (user) => {
  delete remoteUsers[user.uid];
  let item = document.getElementById(`user-container-${user.uid}`);
  if (item) {
    item.remove();
  }

  if (userIdInDisplayFrame === `user-container-${user.uid}`) {
    displayFrame.style.display = null;

    let videoFrames = document.getElementsByClassName("video__container");
    for (let i = 0; videoFrames.length > i; i++) {
      videoFrames[i].style.height = "300px";
      videoFrames[i].style.width = "300px";
    }
  }
};

let toggleMic = async (e) => {
  let button = e.currentTarget;
  if (localTracks[0].muted) {
    await localTracks[0].setMuted(false);
    button.classList.add("active");
  } else {
    await localTracks[0].setMuted(true);
    button.classList.remove("active");
  }
};

let toggleCamera = async (e) => {
  let button = e.currentTarget;
  if (localTracks[1].muted) {
    await localTracks[1].setMuted(false);
    button.classList.add("active");
  } else {
    await localTracks[1].setMuted(true);
    button.classList.remove("active");
  }
};

let toggleScreen = async (e) => {
  let screenButton = e.currentTarget;
  let cameraButton = document.getElementById("camera-btn");

  if (!sharingScreen) {
    sharingScreen = true;

    screenButton.classList.add("active");
    cameraButton.classList.remove("active");
    cameraButton.style.display = "none";

    localScreenTracks = await AgoraRTC.createScreenVideoTrack();

    document.getElementById(`user-container-${uid}`).remove();
    displayFrame.style.display = "block";

    let player = `<div class="video__container" id="user-container-${uid}">
                        <div class="video-player" id="user-${uid}"></div>
                      </div>`;
    displayFrame.insertAdjacentHTML("beforeend", player);
    document
      .getElementById(`user-container-${uid}`)
      .addEventListener("click", expandVideoFrame);

    userIdInDisplayFrame = `user-container-${uid}`;
    localScreenTracks.play(`user-${uid}`);

    await client.unpublish([localTracks[1]]);
    await client.publish([localScreenTracks]);

    let videoFrames = document.getElementsByClassName("video__container");
    for (let i = 0; videoFrames.length > i; i++) {
      if (videoFrames[i].id !== userIdInDisplayFrame) {
        videoFrames[i].style.height = "100px";
        videoFrames[i].style.width = "100px";
      }
    }
  } else {
    sharingScreen = false;
    cameraButton.style.display = "block";
    document.getElementById(`user-container-${uid}`).remove();
    await client.unpublish([localScreenTracks]);

    switchToCamera();
  }
};

let leaveStream = async (e) => {
  e.preventDefault();

  document.getElementById("join-btn").style.display = "block";
  document.getElementsByClassName("stream__actions")[0].style.display = "none";

  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].stop();
    localTracks[i].close();
  }

  await client.unpublish(localTracks);

  if (localScreenTracks) {
    await client.unpublish([localScreenTracks]);
  }

  document.getElementById(`user-container-${uid}`).remove();

  if (userIdInDisplayFrame === `user-container-${uid}`) {
    displayFrame.style.display = null;

    for (let i = 0; videoFrames.length > i; i++) {
      videoFrames[i].style.height = "300px";
      videoFrames[i].style.width = "300px";
    }
  }
};

document.getElementById("camera-btn").addEventListener("click", toggleCamera);
document.getElementById("mic-btn").addEventListener("click", toggleMic);
document.getElementById("screen-btn").addEventListener("click", toggleScreen);
document.getElementById("join-btn").addEventListener("click", joinStream);
document.getElementById("leave-btn").addEventListener("click", leaveStream);

joinRoomInit();
