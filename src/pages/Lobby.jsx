import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/lobby.css";
import Preview from '../components/Preview'; // Import the new Preview component
import Button from '@mui/material/Button'

const Lobby = () => {
  const [roomId, setRoomId] = useState(
    new URLSearchParams(window.location.search).get("room")
  );


  const [username, setUsername] = useState(
    sessionStorage.getItem("display_name") || ""
  );
  const [meetingTitle, setMeetingTitle] = useState("");
  const [maxUsers, setMaxUsers] = useState("");
  const [rtcChannelName, setRtcChannelName] = useState(
    sessionStorage.getItem("rtc_channel")
  );
  const [showPreview, setShowPreview] = useState(false); // New state to control the preview display
  const [prevMicOn, setMicOn] = useState(true);
  const [prevCameraOn, setCameraOn] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!rtcChannelName && !roomId) {
      navigate("/");
    }
    fetchUserBrief();
  }, []);

  const fetchUserBrief = async () => {
    const accessToken = sessionStorage.getItem("access_token");
    try {
      const response = await fetch(
        "https://dev.gigagates.com/social-commerce-backend/v1/user/brief",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await response.json();
      sessionStorage.setItem("chat_user_name", data.data.chatUserName);
    } catch (error) {
      console.error("Failed to fetch user brief:", error);
    }
  };

  const createNewRoom = async () => {
    const accessToken = sessionStorage.getItem("access_token");
    const chatUserName = sessionStorage.getItem("chat_user_name");
    const title = meetingTitle || "Untitled Meeting";
    const users = maxUsers || 10;

    try {
      const response = await fetch(
        "https://dev.gigagates.com/social-commerce-backend/v1/chat/room/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: title,
            description: "",
            maxusers: users,
            owner: chatUserName,
            members: [],
          }),
        }
      );
      const data = await response.json();
      const newRoomId = data.data.data;

      sessionStorage.setItem("new_room_id", newRoomId);
      navigate(`/room?room=${newRoomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    sessionStorage.setItem("display_name", username);
    if (!roomId) {
      await createNewRoom();
      alert("The room is created");
    } else {
      setShowPreview(true);

      // navigate(`/room?room=${roomId}`);
    }
  };

  const handleJoinMeeting = () => {
    navigate(`/room?room=${roomId}`, { state: {prevMicOn, prevCameraOn } });
  };

  return (
    <div className="lobby-container">
      <header id="nav">
        <div className="nav--list">
          <a href="/lobby">
            <h3 id="logo">
              <span>Meet.MyDay</span>

            </h3>
          </a>
        </div>

        <div id="nav__links">
          <a className="nav__link" href="/">
            Lobby
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="#ede0e0"
              viewBox="0 0 24 24"
            >
              <path d="M20 7.093v-5.093h-3v2.093l3 3zm4 5.907l-12-12-12 12h3v10h7v-5h4v5h7v-10h3zm-5 8h-3v-5h-8v5h-3v-10.26l7-6.912 7 6.99v10.182z" />
            </svg>
          </a>
          <button className="nav__link" onClick={createNewRoom}>
            Create Room
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="#ede0e0"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z" />
            </svg>
          </button>
        </div>
      </header>

      {showPreview ? (
        <Preview
          onJoin={handleJoinMeeting}
          onCancel={() => setShowPreview(false)}
          micOn={prevMicOn}
          setMicOn={setMicOn}
          cameraOn={prevCameraOn}
          setCameraOn={setCameraOn} />
      ) : (

        <main id="room__lobby__container">
          <div id="form__container">
            <div id="form__container__header">
              <p>👋 Create or Join Room</p>
            </div>

            <form id="lobby__form" onSubmit={handleSubmit}>
              <div className="form__field__wrapper">
                <label>Your Name</label>
                <input
                  type="text"
                  name="name"
                  id="username"
                  placeholder="Enter your display name..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {!roomId && (
                <>
                  <div className="form__field__wrapper">
                    <label>Meeting Title</label>
                    <input
                      type="text"
                      name="title"
                      id="meeting-title"
                      placeholder="Enter the meeting title..."
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form__field__wrapper">
                    <label>Max Users</label>
                    <input
                      type="number"
                      max="30"
                      name="maxusers"
                      id="max-users"
                      placeholder="Enter max users..."
                      value={maxUsers}
                      onChange={(e) => setMaxUsers(e.target.value)}
                    />
                    <small>Default is 10 users if not specified.</small>
                  </div>
                  <div className="form__field__wrapper">
                    <button type="submit" onClick={createNewRoom}>
                      Craete New Room
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                      >
                        <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
                      </svg>
                    </button>
                  </div>
                </>
              )}

              <div className="form__field__wrapper">
                <button type="submit">
                  Go to Room
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </main>
      )}
    </div>
  );
};

export default Lobby;
