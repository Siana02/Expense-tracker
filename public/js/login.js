// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // Login function
    async function loginUser(username, password) {
        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = true;
    
        try {
            // Send login request to the backend
            const response = await fetch('api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
    
            // Parse the response JSON
            const data = await response.json(); // Extract data from the response
    
            // console.log(data); // Debugging: log the response data
    
            if (response.ok) { // Check if the response status is OK (200-299)
                alert(data.message);
                localStorage.setItem('token', data.token); // Store token in localStorage
                
                // Redirect to the dashboard or any other page
                window.location.href = data.redirectTo || '/dashboard';
            } else {
                alert( 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred, please try again later.');
        } finally {
            submitButton.disabled = false; // Re-enable the submit button
        }
    }
    // Add event listener for form submission
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Call loginUser function
        loginUser(username, password);
    });

});
