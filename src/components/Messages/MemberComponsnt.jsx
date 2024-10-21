import React from 'react';
import { Videocam as VideocamIcon, VideocamOff as VideocamOffIcon, Mic as MicIcon, MicOff as MicOffIcon } from '@mui/icons-material';

const MemberItem = ({ memberId, name, cameraOn, micOn, onRemove }) => {
    return (
        <div className="member__wrapper" id={`member__${memberId}__wrapper`}>
            <span className="green__icon"></span>
            <p className="member_name">{name}</p>
            <div className="status-icons" id={`status-icons-${memberId}`}>
                <span id={`camera-status-${memberId}`} className="camera-status">
                    {cameraOn ? <VideocamIcon /> : <VideocamOffIcon style={{ color: 'red' }} />}
                </span>
                <span id={`mic-status-${memberId}`} className="mic-status">
                    {micOn ? <MicIcon /> : <MicOffIcon style={{ color: 'red' }} />}
                </span>
            </div>
        </div>
    );
};

export default MemberItem;
