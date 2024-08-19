import React from "react";
import { Typography } from "@mui/material";

import NotificationSnackbar from "./components/NotificationSnackbar";
import MeetingDrawer from "./components/MeetingDrawer";
import HostComponent from "./components/HostComponent";
import ScreenSharingComponent from "./components/ScreenSharingComponent";

const HostMeeting = () => {
  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h5">Host a New Meeting</Typography>

      <HostComponent />

      {/* Display notification */}
      <NotificationSnackbar />

      <ScreenSharingComponent />
      {/* Drawer */}
      <MeetingDrawer />
    </div>
  );
};

export default HostMeeting;
