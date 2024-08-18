import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Drawer,
  Box,
  IconButton,
} from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';

import axios from "axios";
import { onMessage } from "firebase/messaging";
import { messaging } from "../utils/firebaseUtils";

const HostMeeting = () => {
  // Drawer
  const [stage, setStage] = React.useState({
    right: false,
  });

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setStage({ ...stage, [anchor]: open });
  };

  const list = (anchor) => (
    <Box
      sx={{ width: 250, padding: "10px" }}
      role="presentation"
      // onClick={toggleDrawer(anchor, false)}
      // onKeyDown={toggleDrawer(anchor, false)}
    >
      <div style={{ marginTop: "20px" }}>
        <Typography
          variant="body1"
          style={{ marginTop: "10px", marginBottom: "10px" }}
        >
          {meetingLink}
        </Typography>

        <Button
          variant="contained"
          color="secondary"
          onClick={copyToClipboardLink}
        >
          Copy Meeting Link
        </Button>
        {copyLinkSuccess && (
          <Typography color="success">{copyLinkSuccess}</Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={shortenLink}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Generate Short Link"}
        </Button>
        {shortLink && (
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={copyToClipboardShortLink}
              style={{ marginLeft: "10px" }}
            >
              Copy Short Link
            </Button>
            <Typography variant="body1" style={{ marginTop: "10px" }}>
              Share this link with participants:
            </Typography>
            <Typography variant="body2" style={{ wordWrap: "break-word" }}>
              {shortLink}
            </Typography>
          </>
        )}
        {copySuccess && <Typography color="success">{copySuccess}</Typography>}
      </div>
    </Box>
  );

  // Drawer End
  const { state } = useLocation();
  const { channelName, token } = state || {};
  const [copySuccess, setCopySuccess] = useState("");
  const [copyLinkSuccess, setCopyLinkSuccess] = useState("");
  const [shortLink, setShortLink] = useState("");
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

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

  useEffect(() => {
    if (notifications.length > 0) {
      setCurrentNotification(notifications[0]);
      setOpen(true);
    }
  }, [notifications]);

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

  const meetingLink = `http://localhost:5173/join?channelName=${encodeURIComponent(
    channelName
  )}&token=${encodeURIComponent(token)}`;

  const shortenLink = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `https://api.tinyurl.com/create`,
        {
          url: meetingLink,
          domain: "tinyurl.com",
          alias: "",
          tags: "",
          expires_at: "",
          description: "Meeting link",
        },
        {
          headers: {
            Authorization: `Bearer vikYnQMIxeoI9zwT5n8RJlsytQWC3rw4lxdb47jGvXSYRL8UXGSN9jMY3Hoh`,
            "Content-Type": "application/json",
          },
        }
      );
      setShortLink(response.data.data.tiny_url);
    } catch (error) {
      console.error("Failed to shorten the link:", error);
      setCopySuccess("Failed to shorten the link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboardLink = () => {
    navigator.clipboard
      .writeText(meetingLink)
      .then(() => {
        setCopyLinkSuccess("Link copied to clipboard!");
      })
      .catch((err) => {
        setCopyLinkSuccess("Failed to copy link");
      });
  };

  const copyToClipboardShortLink = () => {
    navigator.clipboard
      .writeText(shortLink)
      .then(() => {
        setCopySuccess("Short Link copied to clipboard!");
      })
      .catch((err) => {
        setCopySuccess("Failed to copy short link");
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h5">Host a New Meeting</Typography>

      {/* Drawer */}
      <React.Fragment key="right">
        <IconButton onClick={toggleDrawer("right", true)}>
          <InfoIcon />
        </IconButton>
        <Drawer
          anchor="right"
          open={stage.right}
          onClose={toggleDrawer("right", false)}
        >
          {list("right")}
        </Drawer>
      </React.Fragment>
      {/* Drawer End */}

      {/* Display notification */}
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
      >
        {/* <Alert onClose={handleClose} severity="info" sx={{ width: "100%" }}>
          {currentNotification?.data?.title}
        </Alert> */}
      </Snackbar>
    </div>
  );
};

export default HostMeeting;
