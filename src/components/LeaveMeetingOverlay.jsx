import React from 'react';
import { Box, Button, Typography } from '@mui/material';

const LeaveMeetingOverlay = ({ meetingGuid, onRejoin, onNavigateToLobby }) => {
    return (
        <Box
            sx={{
                position: 'fixed',   // Fix to viewport
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
                display: 'flex',     // Use flexbox
                flexDirection: 'column', // Arrange items in a column
                justifyContent: 'center', // Center vertically
                alignItems: 'center', // Center horizontally
                color: 'white',      // Text color
                zIndex: 9999,       // Ensure it's on top
            }}
        >
            <Typography variant="h6">You have left the meeting</Typography>
            <Button
                onClick={() => onNavigateToLobby(meetingGuid)}
                variant="contained"
                color="primary"
                sx={{ mt: 2 }} // Add some margin-top
            >
                Go to Lobby
            </Button>
            <Button
                onClick={onRejoin}
                variant="contained"
                color="secondary"
                sx={{ mt: 1 }} // Add some margin-top
            >
                Rejoin
            </Button>
        </Box>
    );
};

export default LeaveMeetingOverlay;
