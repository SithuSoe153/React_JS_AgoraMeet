import React, { useState, useEffect } from "react";
import { Snackbar, Button } from "@mui/material";

import { onMessage } from "firebase/messaging";
import { messaging } from "../../../utils/firebaseUtils";

const NotificationSnackbar = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    if (notifications.length > 0) {
      setCurrentNotification(notifications[0]);
      setOpen(true);
    }
  }, [notifications]);

  useEffect(() => {
    const handleMessage = (payload) => {
      console.log("Received background message:", payload);
      setNotifications((prev) => [...prev, payload]);
    };

    onMessage(messaging, handleMessage);

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    setNotifications((prev) => prev.slice(1)); // Remove the handled notification
  };

  const handleAccept = () => {
    console.log("Accepted:", currentNotification);
    // Handle accept action here
    handleClose();
  };

  const handleReject = () => {
    console.log("Rejected:", currentNotification);
    // Handle reject action here
    handleClose();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      message={currentNotification?.data?.chatUserName}
      action={
        <>
          <Button color="inherit" onClick={handleAccept}>
            Accept
          </Button>
          <Button color="inherit" onClick={handleReject}>
            Reject
          </Button>
        </>
      }
    />
  );
};

export default NotificationSnackbar;
