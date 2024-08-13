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
document.getElementById('password').addEventListener('input', function() {
    const strength = getPasswordStrength(this.value);
    document.getElementById('password-strength').textContent = strength.message;
    document.getElementById('password-strength').style.color = strength.color;
});

// Add event listener to confirm password input for matching
document.getElementById('confirm-password').addEventListener('input', function() {
    const password = document.getElementById('password').value;
    if (this.value !== password) {
        this.setCustomValidity('Passwords do not match');
    } else {
        this.setCustomValidity('');
    }
});

// Add event listener to check if terms and conditions are accepted
document.querySelector('form').addEventListener('submit', function(event) {
    if (!document.getElementById('terms').checked) {
        event.preventDefault(); // Prevent form submission
        alert('You must agree to the terms and conditions.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent actual form submission for demo
        alert('Registration form submitted successfully!');
    });
});
