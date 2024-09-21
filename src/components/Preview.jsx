// Preview.jsx
import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import Button from "@mui/material/Button";
import "../styles/preview.css"; // Create a new CSS file for the preview component

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
        <div className="preview-container">
            <div id="preview-video" className="preview-video"></div>
            <div className="controls">
                <Button
                    onClick={toggleMic}
                    variant="contained"
                    color={micOn ? "primary" : "secondary"}
                >
                    {micOn ? "Turn Off Mic" : "Turn On Mic"}
                </Button>
                <Button
                    onClick={toggleCamera}
                    variant="contained"
                    color={cameraOn ? "primary" : "secondary"}
                >
                    {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
                </Button>
                <Button onClick={onJoin} variant="contained" color="success">
                    Join Meeting
                </Button>
                <Button onClick={handleCancel} variant="contained" color="error">
                    Cancel
                </Button>
            </div>
        </div>
    );
};

export default Preview;
