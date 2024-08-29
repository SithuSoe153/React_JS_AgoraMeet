const APP_ID = "69b5921596cd4632a94ead5fe6706777";
const API_BASE_URL = "https://dev.gigagates.com/social-commerce-backend/v1";

// let uid = sessionStorage.getItem("uid");
// if (!uid) {
//   uid = String(Math.floor(Math.random() * 10000));
//   sessionStorage.setItem("uid", uid);
// }

let uid = sessionStorage.getItem("display_name");
let chat_user_name = sessionStorage.getItem("chat_user_name");
console.log("chat_user_name", chat_user_name);

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
  // const accessToken = sessionStorage.getItem("access_token");

  try {
    const response = await fetch(
      // `${API_BASE_URL}/chat/room/list?chatRoomGuid=${meetingGuid}`,
      `${API_BASE_URL}/chat/room/list?chatRoomGuid=d48e58a2-8d30-4ea8-952f-ca3003f2d32d`,
      {
        method: "GET",
        // mode: "no-cors",
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

// joinRoomInit function inside room_rtc.js or your main JavaScript file for handling room operations

const sendMessageToRoom = async (message, from, to) => {
  // Create the body of the request based on the endpoint's requirements
  const body = {
    from: from, // Sender's username
    to: [to], // Recipient's room ID as an array
    type: "txt", // Type of message, e.g., 'txt'
    body: {
      msg: message, // The actual message content
    },
  };

  try {
    // Make the POST request to the appropriate endpoint
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

  // Get the message content from the form input
  let message = e.target.message.value;
  const from = "soe"; // Replace with dynamic sender username
  const to = "257431672258562"; // Replace with dynamic recipient room ID

  // Call the updated send message function
  await sendMessageToRoom(message, from, to);

  // Update the DOM to display the message
  addMessageToDom(from, message);

  // Reset the form input
  e.target.reset();
};

async function joinRoomInit() {
  addBotMessageToDom(`Welcome to the room ${displayName}! 👋`);

  await fetchMeetingDetails();
  await getRoomDetails(groupId);

  // try {
  //   // Make an API call to join the room
  //   const response = await fetch(
  //     `https://dev.gigagates.com/social-commerce-backend/v1/chat/room/user/token?channelName=${channelName}&groupId=${groupId}&chatUserName=${chatUserName}&status=true`,
  //     {
  //       method: "GET",
  //     }
  //   );

  //   const data = await response.json();

  //   // if (response.ok && data && data.data) {
  //   //   console.log("User successfully joined:", data);

  //   //   // Optionally update UI based on response
  //   //   addMemberToDom(chatUserName); // assuming chatUserName is your MemberId
  //   //   addBotMessageToDom(`Welcome to the room ${chatUserName}! 👋`);

  //   //   // Additional actions like fetching details if necessary
  //   //   await fetchMeetingDetails(); // Call if further details are required

  //   //   // If needed, send a welcome message
  //   //   sendWelcomeMessage(chatUserName);
  //   // } else {
  //   //   console.error("Failed to join the room:", data);
  //   //   // alert("Failed to join the room.");
  //   // }
  // } catch (error) {
  //   console.error("Error during room join:", error);
  //   // alert("An error occurred while joining the room.");
  // }
}

// Function to send a welcome message to the group
async function sendWelcomeMessage(username, groupId) {
  // Construct the payload as per the endpoint requirements
  const messagePayload = {
    from: username, // Sender's username
    to: [groupId], // Array of recipient IDs (group ID in this case)
    type: "txt", // Message type
    body: {
      msg: `Hello everyone, ${username} has joined!`, // Welcome message
    },
  };

  try {
    // Send the POST request to the correct endpoint
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

    // Handle the response to confirm if the message was sent successfully
    if (response.ok) {
      console.log("Welcome message sent successfully.");
    } else {
      console.error("Failed to send welcome message.");
    }
  } catch (error) {
    console.error("Error sending welcome message:", error);
  }
}

sendWelcomeMessage("john", groupId);

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
