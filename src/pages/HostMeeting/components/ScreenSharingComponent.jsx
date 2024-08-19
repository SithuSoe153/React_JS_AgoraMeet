import React, { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Button, Typography } from '@mui/material';

const ScreenSharingComponent = () => {
    const [client, setClient] = useState(null);
    const [localTracks, setLocalTracks] = useState({ screenVideoTrack: null, screenAudioTrack: null });

    useEffect(() => {
        const initClient = async () => {
            const agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
            setClient(agoraClient);
        };
        initClient();

        return () => {
            leaveChannel();
        };
    }, []);

    const startScreenSharing = async () => {
        try {
            const screenTrack = await AgoraRTC.createScreenVideoTrack({
                encoderConfig: "1080p_1",
                optimizationMode: "detail"
            });

            if (Array.isArray(screenTrack)) {
                setLocalTracks({ screenVideoTrack: screenTrack[0], screenAudioTrack: screenTrack[1] });
            } else {
                setLocalTracks({ screenVideoTrack: screenTrack, screenAudioTrack: null });
            }

            const appID = "69b5921596cd4632a94ead5fe6706777";
            const channel = "1017soe";
            const token = "00669b5921596cd4632a94ead5fe6706777IAB53d+7Fth0yP/cD8Q7Woc+QWP5f7EkmZw7KDE5PT3WOa0Tte8AAAAAIgBbcxHsFSvEZgQAAQCVXc+KAgCVXc+KAwCVXc+KBACVXc+K";

            // Join the channel as a host
            await client.setClientRole("host");
            await client.join(appID, channel, token, null);

            // Publish both tracks if available
            if (localTracks.screenAudioTrack) {
                await client.publish([screenTrack[0], screenTrack[1]]);
            } else {
                await client.publish([screenTrack]);
            }

            screenTrack.play("local-player");

            screenTrack.on("track-ended", () => {
                console.log("Screen sharing stopped");
                leaveChannel();
            });

        } catch (error) {
            console.error("Error starting screen sharing", error);
        }
    };

    const leaveChannel = async () => {
        if (localTracks.screenVideoTrack) {
            localTracks.screenVideoTrack.stop();
            localTracks.screenVideoTrack.close();
        }
        if (localTracks.screenAudioTrack) {
            localTracks.screenAudioTrack.stop();
            localTracks.screenAudioTrack.close();
        }
        if (client) {
            await client.leave();
        }
    };

    return (
        <div>
            <Typography variant="h5">Agora Screen Sharing</Typography>
            {/* <div id="local-player" style={{ width: '640px', height: '480px', backgroundColor: '#000' }}></div> */}
            <Button variant="contained" color="primary" onClick={startScreenSharing}>
                Start Screen Sharing
            </Button>
            <Button variant="contained" color="secondary" onClick={leaveChannel}>
                Stop Sharing
            </Button>
        </div>
    );
};

export default ScreenSharingComponent;
