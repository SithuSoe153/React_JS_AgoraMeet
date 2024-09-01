let handleMemberJoined = async (MemberId) => {
  console.log("A new member has joined the room:", MemberId);
  addMemberToDom(MemberId);

  let members = await channel.getMembers();
  updateMemberTotal(members);

  try {
    let userAttributes = await rtmClient.getUserAttributesByKeys(MemberId, [
      "name",
    ]);

    let name = userAttributes.name || MemberId; // Fallback to MemberId if name is undefined

    if (name === undefined) {
      console.warn(`Name attribute is not defined for user: ${MemberId}`);
    }

    addBotMessageToDom(`Welcome to the room ${name}! 👋`);
  } catch (error) {
    console.error("Failed to fetch user attributes:", error);
    addBotMessageToDom(`Welcome to the room ${MemberId}! 👋`); // Fallback to MemberId
  }
};

let addMemberToDom = async (MemberId) => {
  let userAttributes = await rtmClient.getUserAttributesByKeys(MemberId, [
    "name",
  ]);

  let name = userAttributes.name || MemberId; // Fallback to MemberId if name is undefined

  if (name === undefined) {
    console.warn(`Name attribute is not defined for user: ${MemberId}`);
  }

  let membersWrapper = document.getElementById("member__list");
  let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                        <span class="green__icon"></span>
                        <p class="member_name">${name}</p>
                    </div>`;

  membersWrapper.insertAdjacentHTML("beforeend", memberItem);
};

let updateMemberTotal = async (members) => {
  let total = document.getElementById("members__count");
  total.innerText = members.length;
};

let handleMemberLeft = async (MemberId) => {
  removeMemberFromDom(MemberId);

  let members = await channel.getMembers();
  updateMemberTotal(members);
};

let removeMemberFromDom = async (MemberId) => {
  let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`);
  let name = memberWrapper.getElementsByClassName("member_name")[0].textContent;
  addBotMessageToDom(`${name} has left the room.`);

  memberWrapper.remove();
};

let getMembers = async () => {
  let members = await channel.getMembers();
  updateMemberTotal(members);
  for (let i = 0; members.length > i; i++) {
    addMemberToDom(members[i]);
  }
};

const handleChannelMessage = async (message, MemberId) => {
  console.log("Received a new message from:", MemberId);
  let data;

  try {
    // Parse the incoming message text as JSON
    data = JSON.parse(message.text);
    console.log("Parsed message data:", data);
  } catch (error) {
    // Handle JSON parsing errors
    console.error("Failed to parse incoming message data:", error);
    return; // Exit early if parsing fails
  }

  // Handle chat messages
  if (data.type === "chat") {
    console.log("Displaying chat message:", data);
    addMessageToDom(
      data.displayName || MemberId, // Use MemberId as fallback
      data.body?.msg || data.message // Use data.message as fallback
    );
  }

  // Handle user left event
  if (data.type === "user_left") {
    console.log("Handling user left:", data.uid);
    let userContainer = document.getElementById(`user-container-${data.uid}`);
    if (userContainer) {
      userContainer.remove();
    }

    // Adjust display frame if the current user left
    if (userIdInDisplayFrame === `user-container-${data.uid}`) {
      displayFrame.style.display = null;
      for (let i = 0; i < videoFrames.length; i++) {
        videoFrames[i].style.height = "300px";
        videoFrames[i].style.width = "300px";
      }
    }
  }
};

// let handleChannelMessage = async (messageData, MemberId) => {
//   console.log("A new message was received from:", MemberId);
//   console.log("Message data:", messageData);

//   let data;
//   try {
//     data = JSON.parse(messageData.text);
//     console.log("Parsed message data:", data);
//   } catch (error) {
//     console.error("Failed to parse incoming message data:", error);
//     return; // Exit early if parsing fails
//   }

//   // Display chat messages in real-time
//   if (data.type === "chat") {
//     console.log("Displaying chat message:", data);
//     addMessageToDom(
//       data.displayName || MemberId,
//       data.body.msg || data.message
//     ); // Adjust according to actual message format
//   }

//   // Handle user leaving the room
//   if (data.type === "user_left") {
//     console.log("Handling user left:", data.uid);
//     let userContainer = document.getElementById(`user-container-${data.uid}`);
//     if (userContainer) {
//       userContainer.remove();
//     }

//     // Reset display frame if the user leaving is currently displayed
//     if (userIdInDisplayFrame === `user-container-${data.uid}`) {
//       displayFrame.style.display = null;
//       for (let i = 0; i < videoFrames.length; i++) {
//         videoFrames[i].style.height = "300px";
//         videoFrames[i].style.width = "300px";
//       }
//     }
//   }
// };

const sendMessageToRTMChannel = async (message) => {
  try {
    const messagePayload = {
      text: JSON.stringify({ type: "chat", body: { msg: message } }),
    };
    await channel.sendMessage(messagePayload);
    console.log("Message sent to RTM channel successfully.");
  } catch (error) {
    console.error("Failed to send message to RTM channel:", error);
  }
};


// const handleChannelMessage = async (messageData, MemberId) => {
//   console.log("A new message was received from:", MemberId);
//   let data;

//   try {
//     data = JSON.parse(messageData.text);
//     console.log("Parsed message data:", data);
//   } catch (error) {
//     console.error("Failed to parse incoming message data:", error);
//     return; // Exit early if parsing fails
//   }

//   if (data.type === "chat") {
//     addMessageToDom(
//       data.displayName || MemberId,
//       data.body.msg || data.message
//     ); // Adjust according to actual message format
//   }
// };

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

let sendMessage = async (e) => {
  e.preventDefault();

  let message = e.target.message.value;
  const from = chatUserName;
  const to = groupId;

  // Call the updated send message function
  // await sendMessageToRoom(message, from, to);
  await sendMessageToRTMChannel(message);

  addMessageToDom(from, message);

  e.target.reset();
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

let addMessageToDom = (name, message) => {
  let messagesWrapper = document.getElementById("messages");

  let newMessage = `<div class="message__wrapper">
                        <div class="message__body">
                            <strong class="message__author">${name}</strong>
                            <p class="message__text">${message}</p>
                        </div>
                    </div>`;

  // Add the new message to the DOM
  messagesWrapper.insertAdjacentHTML("beforeend", newMessage);

  // Scroll to the latest message
  let lastMessage = document.querySelector(
    "#messages .message__wrapper:last-child"
  );
  if (lastMessage) {
    lastMessage.scrollIntoView({ behavior: "smooth" });
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

let addBotMessageToDom = (botMessage) => {
  let messagesWrapper = document.getElementById("messages");

  let newMessage = `<div class="message__wrapper">
                        <div class="message__body__bot">
                            <strong class="message__author__bot">🤖 Meet.MyDay Bot</strong>
                            <p class="message__text__bot">${botMessage}</p>
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

let leaveChannel = async () => {
  await channel.leave();
  await rtmClient.logout();
};

window.addEventListener("beforeunload", leaveChannel);
let messageForm = document.getElementById("message__form");
messageForm.addEventListener("submit", sendMessage);
