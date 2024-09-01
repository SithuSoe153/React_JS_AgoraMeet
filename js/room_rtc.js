const APP_ID = "19547e2b1603452688a040cc0a219aea";
const API_BASE_URL = "https://dev.gigagates.com/social-commerce-backend/v1";

let uid = sessionStorage.getItem("display_name");
let chatUserName = sessionStorage.getItem("chat_user_name");

// let uid = sessionStorage.getItem("chat_user_name");

// let chatUserName = sessionStorage.getItem("chat_user_name");

if (!chatUserName) {
  console.log("chatUserName is not set in sessionStorage");

  chatUserName = sessionStorage.getItem("display_name");
  sessionStorage.setItem("chat_user_name", chatUserName);
}

let channelName;
let rtcToken;
let groupId;

let client;
let channel;

let rtmClient;
let rtmToken;
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
      `${API_BASE_URL}/chat/room/list?chatRoomGuid=${meetingGuid}`,
      // `${API_BASE_URL}/chat/room/list?chatRoomGuid=d48e58a2-8d30-4ea8-952f-ca3003f2d32d`,
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

async function getRtmToken(chatUserName) {
  try {
    const response = await fetch(
      // `${API_BASE_URL}/chat/user/${chatUserName}/token`,
      `${API_BASE_URL}/agora/generateRtmToken?userId=${chatUserName}&expirationInSeconds=86400000`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    rtmToken = await response.text();

    console.log("name", chatUserName);
    console.log("Response data rtm token:", rtmToken);

    if (response.ok) {
      return rtmToken; // Adjust according to the actual response structure
    } else {
      console.error("Failed to fetch RTM token:", data);
      return null;
    }
  } catch (error) {
    console.error("Error fetching RTM token:", error);
    return null;
  }
}

// Message End

async function joinRoomInit() {
  const meetingDetails = await fetchMeetingDetails();
  let clientToken = meetingDetails.rtcToken;
  clientToken =
    "00619547e2b1603452688a040cc0a219aeaIAA7vcA/Yz21+e2I3VCqJLMAVHiNtdAiRB/IOAnIvDKK5a0Tte8AAAAAIgDwwCugBd3VZgQAAQCF5/prAgCF5/prAwCF5/prBACF5/pr";

  const clientChannelName = meetingDetails.channelName;
  console.log("channelName", uid);

  // RTM Start
  rtmClient = await AgoraRTM.createInstance(APP_ID);

  await getRtmToken(displayName);

  try {
    await rtmClient.login({ token: rtmToken, uid: displayName });
    console.log("RTM Client logged in successfully.");
  } catch (error) {
    console.error("RTM login failed:", error);
    alert("RTM login failed. Please check your user ID and token.");
    return; // Exit if login fails
  }

  // Create and join the channel
  channel = rtmClient.createChannel(groupId);
  try {
    await channel.join();
    console.log("Joined RTM channel successfully.");
  } catch (error) {
    console.error("Failed to join RTM channel:", error);
    alert("Failed to join the RTM channel.");
  }

  // Set up message handler for the channel
  channel.on("MemberJoined", handleMemberJoined);
  channel.on("MemberLeft", handleMemberLeft);
  channel.on("ChannelMessage", handleChannelMessage);

  // RTM End

  console.log("uid", uid);

  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  await client.join(
    clientToken,
    clientChannelName,
    null,
    uid?.replace(/\s+/g, "")
  );

  client.on("user-published", handleUserPublished);
  client.on("user-left", handleUserLeft);

  await fetchMeetingDetails();
  // await getRoomDetails(groupId);
  // await addUserToChatRoom(channelName, groupId, chatUserName);

  await sendWelcomeMessage(chatUserName, groupId);

  getMembers();
}

let joinStream = async () => {
  document.getElementById("join-btn").style.display = "none";
  document.getElementsByClassName("stream__actions")[0].style.display = "flex";

  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  let player = `
    <div class="video__container" id="user-container-${uid}">
      <div class="video-player" id="user-${uid}"></div>
      <div class="video-name">${displayName}</div>
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

let handleUserPublished = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);

  if (mediaType === "video") {
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player === null) {
      player = `
        <div class="video__container" id="user-container-${user.uid}">
          <div class="video-player" id="user-${user.uid}"></div>
          <div class="video-name">${user.uid}</div>
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
                        <div class="video-name" id="name-${displayName}"></div>
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
