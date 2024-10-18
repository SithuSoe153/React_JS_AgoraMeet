import React from 'react';

const MemberItem = ({ memberId }) => {
    const formattedUid = memberId.replace(/_/g, ' ');

    return (
        <div className={`member__wrapper`} id={`member__${memberId}__wrapper`}>
            <span className="green__icon"></span>
            <p className="member_name">{formattedUid}</p>
        </div>
    );
};

export default MemberItem;
