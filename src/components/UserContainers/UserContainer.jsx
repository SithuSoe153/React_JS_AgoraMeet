import React from 'react';

const UserContainer = ({ uid, displayName, micOn, cameraOn, onClick }) => {
  return (
    <div className="video__container" id={`user-container-${uid}`} onClick={onClick}>
      <div className="video-player" id={`user-${uid}`}></div>
      <div className="video-name">{displayName.replace(/_/g, ' ')}</div>
      <div className="placeholder" id={`placeholder-${uid}`} style={{ display: micOn || cameraOn ? 'none' : 'block' }}>
        {micOn || cameraOn ? "User is in the meeting" : "Camera and Mic are Off"}
      </div>
      <div className="status-icons" id={`status-icons-${uid}`}>
        <span id={`camera-status-${uid}`} className="camera-status">{cameraOn ? '📷' : '🔇'}</span>
        <span id={`mic-status-${uid}`} className="mic-status">{micOn ? '🎤' : '🔇'}</span>
      </div>
    </div>
  );
};

export default UserContainer;