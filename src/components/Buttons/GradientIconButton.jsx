import React, { forwardRef } from 'react';
import { IconButton } from '@mui/material';

const GradientIconButton = forwardRef(({ onClick, isSelected, children, ...props }, ref) => {
    return (
        <IconButton
            onClick={onClick}
            ref={ref}
            sx={{
                background: isSelected
                    ? "linear-gradient(90deg, #0A10C2 0%, #0098F5 100%)"
                    : "transparent",
                color: isSelected ? "#fff" : "#fff",
                "&:hover": {
                    background: isSelected
                        ? "linear-gradient(90deg, #74b9ff 0%, #a29bfe 100%)"
                        : "rgba(255, 255, 255, 0.1)",
                },
                "&:active": {
                    background: isSelected
                        ? "linear-gradient(90deg, #0A10C2 0%, #0098F5 80%)"
                        : "rgba(255, 255, 255, 0.2)",
                },
                border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
            }}
            {...props}
        >
            {children}
        </IconButton>
    );
});

export default GradientIconButton;
