// Login.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // Perform login
      const loginResponse = await axios.post('https://dev.gigagates.com/social-commerce-backend/v1/user/', {
        username,
        password,
      });

      const { access_token } = loginResponse.data.data;

      // Fetch RTC details
      const rtcResponse = await axios.get('https://dev.gigagates.com/social-commerce-backend/v1/person/rtc', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { channelName, token } = rtcResponse.data.data;

      // Redirect to HostMeeting with channelName and token as state
      navigate('/host', { state: { channelName, token } });

    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to log in. Please check your credentials.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h5">Login</Typography>
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        margin="normal"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        label="Password"
        variant="outlined"
        fullWidth
        margin="normal"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleLogin}>
        Login
      </Button>
      {error && <Typography color="error">{error}</Typography>}
    </div>
  );
};

export default Login;
