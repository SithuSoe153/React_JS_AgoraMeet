// Preview.jsx
import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import JoinMeetingIcon from "@mui/icons-material/VideoCall";
import CancelIcon from "@mui/icons-material/Cancel";
import "../styles/preview.css"; // Ensure the styles are defined for layout

const Preview = ({ onJoin, onCancel, micOn, setMicOn, cameraOn, setCameraOn }) => {
    const localTracksRef = useRef({ micTrack: null, cameraTrack: null });

    useEffect(() => {
        const setupLocalPreview = async () => {
            try {
                // Create microphone and camera tracks for preview
                const [micTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
                localTracksRef.current = { micTrack, cameraTrack };

                // Play the camera track for preview
                cameraTrack.play("preview-video");
            } catch (error) {
                console.error("Error setting up preview:", error);
            }
        };

        setupLocalPreview();

        return () => {
            // Clean up tracks when component is unmounted
            cleanupTracks();
        };
    }, []);

    const cleanupTracks = () => {
        const { micTrack, cameraTrack } = localTracksRef.current;
        if (micTrack) {
            micTrack.stop();
            micTrack.close();
        }
        if (cameraTrack) {
            cameraTrack.stop();
            cameraTrack.close();
        }
    };

    const handleCancel = () => {
        cleanupTracks(); // Clean up tracks when canceling
        onCancel(); // Call the passed onCancel function
    };

    const toggleMic = () => {
        const { micTrack } = localTracksRef.current;
        if (micTrack) {
            micTrack.setEnabled(!micOn);
            setMicOn(!micOn);
        }
    };

    const toggleCamera = () => {
        const { cameraTrack } = localTracksRef.current;
        if (cameraTrack) {
            cameraTrack.setEnabled(!cameraOn);
            setCameraOn(!cameraOn);
        }
    };

    return (

        < main id="room__lobby__container" >
            <div id="form__container">
                <div id="form__container__header">
                    <p>👋 Ready To Join?</p>
                </div>

                <form id="lobby__form" style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContents: "center",
                    padding: "20px",
                }}>


                    <div className="video__container" id="user-container-local" style={{ width: "500px", height: "300px" }}>
                        <div className="video-player" id="preview-video"></div>
                        <div className="video-name">You</div>
                        <div className="placeholder" id="placeholder-local">Camera is Off</div>
                    </div>


                    <div className="controls">
                        <IconButton onClick={toggleMic} color={micOn ? "primary" : "error"}>
                            {micOn ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        <IconButton onClick={toggleCamera} color={cameraOn ? "primary" : "error"}>
                            {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <Button onClick={onJoin} variant="contained" startIcon={<JoinMeetingIcon />} sx={{
                            backgroundColor: "#845695",
                            "&:hover": {
                                backgroundColor: "#6d477c",
                            },
                        }}>
                            Join Meeting
                        </Button>
                        <Button onClick={handleCancel} variant="contained" color="error" startIcon={<CancelIcon />}>
                            Cancel
                        </Button>
                    </div>


                </form>
            </div>
        </main >
    );
};

export default Preview;
