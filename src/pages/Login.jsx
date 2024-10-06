import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css"; // Ensure you have a login.css for custom styles
import TextField from '@mui/material/TextField'

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const API_BASE_URL = "https://dev.gigagates.com/social-commerce-backend/v1";

    try {
      const loginResponse = await fetch(`${API_BASE_URL}/user/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok)
        throw new Error(loginData.message || "Login failed");

      const accessToken = loginData.data.access_token;
      sessionStorage.setItem("access_token", accessToken);

      const rtcResponse = await fetch(`${API_BASE_URL}/person/rtc`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const rtcData = await rtcResponse.json();
      if (!rtcResponse.ok)
        throw new Error(rtcData.message || "Failed to get RTC details");

      sessionStorage.setItem("rtc_channel", rtcData.data.channelName);
      sessionStorage.setItem("rtc_token", rtcData.data.token);

      navigate("/lobby");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <h1>Meet.MyDay</h1>
      </header>
      <main className="login-box">
        <h2>Login to your Account</h2>
        <div className="login-fields">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button className="login-button" onClick={handleLogin}>
          Login
        </button>
      </main>
    </div>
  );
};

export default Login;



// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";

// const Login = () => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMessage, setErrorMessage] = useState("");
//   const navigate = useNavigate();

//   const handleLogin = async () => {
//     const API_BASE_URL = "https://dev.gigagates.com/social-commerce-backend/v1";

//     try {
//       const loginResponse = await fetch(`${API_BASE_URL}/user/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password }),
//       });

//       const loginData = await loginResponse.json();

//       if (!loginResponse.ok)
//         throw new Error(loginData.message || "Login failed");

//       // Store access token
//       const accessToken = loginData.data.access_token;
//       sessionStorage.setItem("access_token", accessToken);

//       // Fetch RTC details
//       const rtcResponse = await fetch(`${API_BASE_URL}/person/rtc`, {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       });

//       const rtcData = await rtcResponse.json();
//       if (!rtcResponse.ok)
//         throw new Error(rtcData.message || "Failed to get RTC details");

//       sessionStorage.setItem("rtc_channel", rtcData.data.channelName);
//       sessionStorage.setItem("rtc_token", rtcData.data.token);

//       // Redirect to lobby
//       navigate("/lobby");
//     } catch (error) {
//       setErrorMessage(error.message);
//     }
//   };

//   return (
//     <div className="login-container">
//       <h2>Login</h2>
//       <input
//         type="text"
//         placeholder="Username"
//         value={username}
//         onChange={(e) => setUsername(e.target.value)}
//       />
//       <input
//         type="password"
//         placeholder="Password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//       />
//       <button onClick={handleLogin}>Login</button>
//       {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
//     </div>
//   );
// };

// export default Login;
