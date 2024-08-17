import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Typography, Button, CircularProgress } from "@mui/material";
import axios from "axios";

const HostMeeting = () => {
  const { state } = useLocation();
  const { channelName, token } = state || {};
  const [copySuccess, setCopySuccess] = useState("");
  const [copyLinkSuccess, setCopyLinkSuccess] = useState("");
  const [shortLink, setShortLink] = useState("");
  const [loading, setLoading] = useState(false); // Loading state

  const meetingLink = `http://localhost:5173/join?channelName=${encodeURIComponent(
    channelName
  )}&token=${encodeURIComponent(token)}`;

  const shortenLink = async () => {
    setLoading(true); // Start loading
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
      setLoading(false); // End loading
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
      {/* <Typography variant="body1">Channel Name: {channelName}</Typography>
      <Typography variant="body1">Token: {token}</Typography> */}
      <div style={{ marginTop: "20px" }}>
        <Typography
          variant="body1"
          style={{ marginTop: "10px", marginBottom: "10px" }}
        >
          {meetingLink}
        </Typography>

        <Button variant="contained" color="secondary" onClick={copyToClipboardLink}>
          Copy Meeting Link
        </Button>
        {copyLinkSuccess && <Typography color="success">{copyLinkSuccess}</Typography>}

        {/*  */}

        <Button
          variant="contained"
          color="primary"
          onClick={shortenLink}
          disabled={loading} // Disable button while loading
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
    </div>
  );
};

export default HostMeeting;
