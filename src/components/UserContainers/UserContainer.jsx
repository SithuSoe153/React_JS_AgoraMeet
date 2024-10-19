import React from 'react';

import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';



const UserContainer = ({ uid, displayName, micOn, cameraOn, onClick }) => {
  return (
    <div className="video__container" id={`user-container-${uid}`} onClick={onClick}>
    <div className="video-player" id={`user-${uid}`}></div>
    <div className="video-overlay">
      <div className="video-name">{displayName.replace(/_/g, ' ')}</div>
      <div className="status-icons" id={`status-icons-${uid}`}>
        <span id={`camera-status-${uid}`} className="camera-status">
          {cameraOn ? <VideocamIcon /> : <VideocamOffIcon style={{ color: 'red' }} />}
        </span>
        <span id={`mic-status-${uid}`} className="mic-status">
          {micOn ? <MicIcon /> : <MicOffIcon style={{ color: 'red' }} />}
        </span>
      </div>
    </div>
    <div className="placeholder" id={`placeholder-${uid}`} style={{ display: micOn || cameraOn ? 'none' : 'block' }}>
      {micOn || cameraOn ? "User is in the meeting" : "Camera and Mic are Off"}
    </div>
  </div>
  
  );
};

export default UserContainer;