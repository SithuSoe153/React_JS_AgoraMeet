import React from "react";
import { Typography } from "@mui/material";

import NotificationSnackbar from "./components/NotificationSnackbar";
import MeetingDrawer from "./components/MeetingDrawer";
import HostComponent from "./components/HostComponent";

const HostMeeting = () => {
  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h5">Host a New Meeting</Typography>

      <HostComponent />

      {/* Drawer */}
      <MeetingDrawer />

      {/* Display notification */}
      <NotificationSnackbar />
    </div>
  );
};

export default HostMeeting;
