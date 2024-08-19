import React from "react";

import NotificationSnackbar from "./components/NotificationSnackbar";
import MeetingDrawer from "./components/MeetingDrawer";
import HostComponent from "./components/HostComponent";

const HostMeeting = () => {
  return (
    <div style={{ padding: "20px" }}>
      <HostComponent />

      {/* Display notification */}
      <NotificationSnackbar />

      {/* Drawer */}
      <MeetingDrawer />
    </div>
  );
};

export default HostMeeting;
