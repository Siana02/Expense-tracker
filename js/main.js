document.getElementById('toggle-dark-mode').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});
document.getElementById('show-toast').addEventListener('click', () => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = 'This is a toast notification!';
    document.body.appendChild(toast);
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
});
document.getElementById('toggle-nav').addEventListener('click', () => {
    const nav = document.querySelector('nav');
    nav.style.display = (nav.style.display === 'none' || nav.style.display === '') ? 'block' : 'none';
});

document.getElementById('increase-font-size').addEventListener('click', () => {
    const root = document.documentElement;
    let currentSize = window.getComputedStyle(root).fontSize;
    currentSize = parseFloat(currentSize);
    root.style.fontSize = (currentSize + 2) + 'px';
});

document.getElementById('reset-form').addEventListener('click', () => {
    document.querySelectorAll('input[type="text"], input[type="password"]').forEach(input => {
        input.value = '';
    });
});
