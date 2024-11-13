require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Database connection configuration
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to authenticate a user
function authenticateToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access denied, no token provided' });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
}
// POST /api/auth/register: Register a new user
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;

    // Check if the user already exists
    db.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
        if (error) return res.status(500).json({ message: 'Database error', error });

        // If user already exists
        if (results.length > 0) return res.status(400).json({ message: 'Username already exists' });

        // Hash the password and insert the new user into the database
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (error, results) => {
            if (error) return res.status(500).json({ message: 'Database error', error });

            // Create a token for the user and return a success message
            const token = jwt.sign({ username: username }, JWT_SECRET, { expiresIn: '1h' });

            // Send the response with the token and a success message
            res.status(201).json({
                message: 'User registered successfully',
                token: token, // Include token in the response
                redirectTo: '/dashboard.html' // Provide the route to redirect to
            });
        });
    });
});


// POST /api/auth/login: User login and JWT generation
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    // Find user by username in the database
    db.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
        if (error) return res.status(500).json({ message: 'Database error', error });
        if (results.length === 0) return res.status(400).json({ message: 'Invalid username or password' });

        const user = results[0];

        // Validate password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(400).json({ message: 'Invalid username or password' });

        // Generate JWT
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

// GET /api/expenses: Retrieve all expenses for a user
app.get('/api/expenses', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.query('SELECT * FROM expenses WHERE userId = ?', [userId], (error, results) => {
        if (error) return res.status(500).json({ message: 'Database error', error });
        res.json(results);
    });
});

// POST /api/expenses: Add a new expense
app.post('/api/expenses', authenticateToken, (req, res) => {
    const { date, amount, category, description } = req.body;
    const userId = req.user.id;

    const newExpense = { userId, date, amount, category, description };
    db.query('INSERT INTO expenses SET ?', newExpense, (error, results) => {
        if (error) return res.status(500).json({ message: 'Database error', error });
        res.json({ id: results.insertId, ...newExpense });
    });
});

// PUT /api/expenses/:id: Update an existing expense
app.put('/api/expenses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { date, amount, category, description } = req.body;
    const userId = req.user.id;

    db.query(
        'UPDATE expenses SET date = ?, amount = ?, category = ?, description = ? WHERE id = ? AND userId = ?',
        [date, amount, category, description, id, userId],
        (error, results) => {
            if (error) return res.status(500).json({ message: 'Database error', error });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Expense not found' });
            res.json({ message: 'Expense updated successfully' });
        }
    );
});

// DELETE /api/expenses/:id: Delete an existing expense
app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    db.query('DELETE FROM expenses WHERE id = ? AND userId = ?', [id, userId], (error, results) => {
        if (error) return res.status(500).json({ message: 'Database error', error });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Expense not found' });
        res.json({ message: 'Expense deleted successfully' });
    });
});

// GET /api/expense: Calculate the total expense for a user
app.get('/api/expense', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.query('SELECT SUM(amount) AS totalExpense FROM expenses WHERE userId = ?', [userId], (error, results) => {
        if (error) return res.status(500).json({ message: 'Database error', error });
        res.json({ totalExpense: results[0].totalExpense || 0 });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
