const API_BASE_URL = "https://dev.gigagates.com/social-commerce-backend/v1";

// Function to handle login
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        // Step 1: Log in and get access token
        const loginResponse = await fetch(`${API_BASE_URL}/user/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const loginData = await loginResponse.json();

        console.log(loginData);
        
        if (!loginResponse.ok) {
            throw new Error(loginData.message || 'Login failed');
        }

        // Step 2: Store the access token
        const accessToken = loginData.data.access_token;
        sessionStorage.setItem('access_token', accessToken);

        // Step 3: Fetch RTC details
        const rtcResponse = await fetch(`${API_BASE_URL}/person/rtc`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const rtcData = await rtcResponse.json();

        if (!rtcResponse.ok) {
            throw new Error(rtcData.message || 'Failed to get RTC details');
        }

        const { channelName, token } = rtcData.data;

        // Store RTC details in sessionStorage or any state management
        sessionStorage.setItem('rtc_channel', channelName);
        sessionStorage.setItem('rtc_token', token);

        // Step 4: Redirect to lobby.html
        window.location.href = 'lobby.html';
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
}
