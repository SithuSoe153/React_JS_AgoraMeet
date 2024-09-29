import React from 'react';
import { IconButton } from '@mui/material';

const GradientIconButton = ({ onClick, isSelected, children, ...props }) => {
    return (
        <IconButton
            onClick={onClick}
            sx={{
                background: isSelected
                    ? "linear-gradient(90deg, #0A10C2 0%, #0098F5 100%)" // Blue gradient when selected
                    : "transparent", // Transparent when not selected
                color: isSelected ? "#fff" : "#fff", // White icon in both cases
                "&:hover": {
                    background: isSelected
                        ? "linear-gradient(90deg, #74b9ff 0%, #a29bfe 100%)" // Light blue when hovered while selected
                        : "rgba(255, 255, 255, 0.1)", // Light transparent when hovered while not selected
                },
                "&:active": {
                    background: isSelected
                        ? "linear-gradient(90deg, #0A10C2 0%, #0098F5 80%)" // Slightly darker blue on active when selected
                        : "rgba(255, 255, 255, 0.2)", // Slightly more visible transparent effect when active while not selected
                },
                border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.3)', // Optional: border for unselected buttons
            }}
            {...props}
        >
            {children}
        </IconButton>
    );
};

export default GradientIconButton;
