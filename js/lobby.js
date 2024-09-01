const API_BASE_URL = "https://dev.gigagates.com/social-commerce-backend/v1";

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");

document.addEventListener("DOMContentLoaded", () => {
  // Hide the Meeting Title and Max Users fields
  if (roomId) {
    document.getElementById("meeting-title-container").style.display = "none";

    document.getElementById("max-users-container").style.display = "none";

    const meetingTitleInput = document.getElementById("meeting-title");
    const maxUsersInput = document.getElementById("max-users");

    if (meetingTitleInput) {
      meetingTitleInput.removeAttribute("required");
    }

    if (maxUsersInput) {
      maxUsersInput.removeAttribute("required");
    }
  }
});
const form = document.getElementById("lobby__form");
const roomInput = document.getElementById("room-input");

let displayName = sessionStorage.getItem("display_name");

const rtcChannelName = sessionStorage.getItem("rtc_channel");
// const rtcChannelName = "1017soe";

if (displayName) {
  form.name.value = displayName.trim();
}

// Check if the RTC channel name is available; otherwise, redirect to login
if (!rtcChannelName && !roomId) {
  window.location.href = "index.html";
} else {
  // Automatically set the room input value with the RTC channel name
  roomInput.value = rtcChannelName;

  // Optionally display the room name in a different element
  const roomNameElement = document.getElementById("display-room-name");
  if (roomNameElement) {
    roomNameElement.textContent = `Room Name: ${rtcChannelName}`;
  }
}

// Function to fetch user brief data
async function fetchUserBrief() {
  const accessToken = sessionStorage.getItem("access_token");

  if (!accessToken) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/brief`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      const { chatUserName } = data.data;
      console.log("chatUserName:", chatUserName);

      sessionStorage.setItem("chat_user_name", chatUserName);
    } else {
      console.error("Failed to fetch user brief:", data);
      alert("Failed to fetch user information.");
    }
  } catch (error) {
    console.error("Error fetching user brief:", error);
    alert("An error occurred while fetching user information.");
  }
}

fetchUserBrief();

// Function to create a new room
async function createNewRoom() {
  const accessToken = sessionStorage.getItem("access_token");
  const chatUserName = sessionStorage.getItem("chat_user_name");

  const meetingTitle =
    document.getElementById("meeting-title").value || "Untitled Meeting";

  let maxUsers = document.getElementById("max-users").value;

  // Default maxUsers to 10 if not specified
  if (!maxUsers) {
    maxUsers = 10;
  } else if (maxUsers > 100) {
    maxUsers = 100;
    alert("Max Users cannot exceed 100. Setting it to 100.");
  }

  console.log(meetingTitle, maxUsers, chatUserName);

  try {
    const response = await fetch(`${API_BASE_URL}/chat/room/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: meetingTitle,
        description: "",
        maxusers: maxUsers,
        owner: chatUserName,
        members: [],
      }),
    });

    const data = await response.json();

    console.log("Response data:", data); // Log the full response data

    if (response.ok && data && data.data) {
      const newRoomId = data.data.id; // Check the response structure
      const inviteCode = data.data.data; // Ensure this is correct

      sessionStorage.setItem("new_room_id", newRoomId);

      return { newRoomId, inviteCode };
    } else {
      console.error("Failed to create room:", data);
      alert("Failed to create room. Please try again.");
      // return null;
    }
  } catch (error) {
    console.error("Error creating room:", error);
    alert("An error occurred while creating the room.");
    return null;
  }
}

async function initializeRoom() {
  roomInput.value = rtcChannelName || roomId;

  const roomNameElement = document.getElementById("display-room-name");
  if (roomNameElement) {
    roomNameElement.textContent = `Room Name: ${roomInput.value}`;
  }
}

initializeRoom();

// Form submission event handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usernameInput = document.getElementById("username");
  const enteredUsername = usernameInput.value.trim();

  sessionStorage.setItem("display_name", enteredUsername);
  console.log(`Using manually entered username: ${enteredUsername}`);

  if (!roomId) {
    // Create a new room if roomId is not in the URL
    const roomData = await createNewRoom();

    if (roomData && roomData.inviteCode) {
      roomId = roomData.newRoomId;
      const inviteCode = roomData.inviteCode;

      // Redirect using the invite code
      window.location = `room.html?room=${inviteCode}`;
    } else {
      // If room creation fails, stop further actions
      return;
    }
  } else {
    // If roomId already exists, proceed with the existing code
    window.location = `room.html?room=${roomId}`;
  }
});
