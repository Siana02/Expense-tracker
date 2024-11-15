document.addEventListener('DOMContentLoaded', () => {

    // Function to check password strength
    function getPasswordStrength(password) {
        let strength = { message: '', color: '' };
        
        if (password.length < 6) {
            strength.message = 'Too short';
            strength.color = 'red';
        } else if (!/[A-Z]/.test(password)) {
            strength.message = 'Add an uppercase letter';
            strength.color = 'orange';
        } else if (!/[a-z]/.test(password)) {
            strength.message = 'Add a lowercase letter';
            strength.color = 'orange';
        } else if (!/[0-9]/.test(password)) {
            strength.message = 'Add a number';
            strength.color = 'orange';
        } else if (!/[!@#$%^&*]/.test(password)) {
            strength.message = 'Add a special character';
            strength.color = 'orange';
        } else {
            strength.message = 'Strong password';
            strength.color = 'green';
        }
        
        return strength;
    }

    // Add event listener to password input for strength checking
    const passwordInput = document.getElementById('password');
    const strengthIndicator = document.getElementById('password-strength');
    passwordInput.addEventListener('input', function () {
        const strength = getPasswordStrength(this.value);
        strengthIndicator.textContent = strength.message;
        strengthIndicator.style.color = strength.color;
    });

    // Add event listener to confirm password input for matching
    const confirmPasswordInput = document.getElementById('confirm-password');
    confirmPasswordInput.addEventListener('input', function () {
        const password = passwordInput.value;
        this.setCustomValidity(this.value !== password ? 'Passwords do not match' : '');
    });

    // Register user function
    function registerUser(username, password, email) {
        const submitButton = document.getElementById('submit-button'); // Ensure button has this id
        submitButton.disabled = true;

        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'User registered successfully') {
                    localStorage.setItem('token', data.token); // Store token (if JWT used)
                    window.location.href = data.redirectTo || '/dashboard'; // Redirect to dashboard
                    document.getElementById('registerForm').reset(); // Clear form fields
                } else {
                    alert(data.message || 'An error occurred during registration');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred, please try again later.');
            })
            .finally(() => {
                submitButton.disabled = false;
            });
    }

    // Add a single event listener for form submission
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        // Collect form values
        const username = document.getElementById('username').value;
        const password = passwordInput.value;
        const email = document.getElementById('email').value;

        // Check if terms are accepted
        if (!document.getElementById('terms').checked) {
            alert('You must agree to the terms and conditions.');
            return;
        }

        // Check form validity
        if (!form.checkValidity()) {
            alert('Please fix the errors before submitting.');
            return;
        }

        // Call registerUser function
        registerUser(username, password, email);
    });

});
