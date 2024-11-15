require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const path = require('path');
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, 'public')));
// Database connection configuration
const db = mysql.createConnection(
    process.env.DB_URI || {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    }
);


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
app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/edit-expense', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'edit_expense.html'));
});

app.get('/add-expense', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add_expense.html'));
});

app.get('/view-expense', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'view_expense.html'));
});

app.get('/expensetracker-terms', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

// or 

// const routes = [
//     { path: '/', view: 'index.html' },
//     { path: '/login', view: 'login.html' },
//     { path: '/register', view: 'register.html' },
//     { path: '/dashboard', view: 'dashboard.html' },
//     { path: '/edit-expense', view: 'edit_expense.html' },
//     { path: '/add-expense', view: 'edit_expense.html' },
//     { path: '/view-expense', view: 'view_expense.html' },
//     { path: '/expensetracker-terms', view: 'terms.html' }
// ]

// routes.forEach(route => {
//     app.get(route.path, async (req, res) => {
//         res.render(route.view)
//     })
// })

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
    const { username, password, email } = req.body;
    console.log("Registering User .....");

    // Basic validation
    if (!username || !password || !email) {
        return res.status(400).json({ message: 'Username, password, and email are required' });
    }

    // Check if the username or email already exists in the database
    db.query('SELECT * FROM Users WHERE username = ? OR email = ?', [username, email], async (error, results) => {
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ message: 'Database error', error });
        }

        // If either the username or email already exists
        if (results.length > 0) {
            return res.status(400).json({
                message: results[0].username === username ? 'Username already exists' : 'Email already exists'
            });
        }

        // Hash the password
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the new user into the database
            db.query('INSERT INTO Users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email], (error, results) => {
                if (error) {
                    console.error('Database error during insert:', error);
                    return res.status(500).json({ message: 'Database error during user registration', error });
                }

                // Create a token for the user
                const token = jwt.sign({ username: username }, JWT_SECRET, { expiresIn: '1h' });

                // Send the response with the token and a success message
                res.status(201).json({
                    message: 'User registered successfully',
                    token: token,  // Include token in the response
                });
            });
        } catch (hashError) {
            console.error('Error hashing password:', hashError);
            res.status(500).json({ message: 'Error hashing password', error: hashError });
        }
    });
});

// POST /api/auth/login: User login and JWT generation
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    console.log("Loging in User...", req.body)

    // Find user by username in the database
    db.query('SELECT * FROM Users WHERE username = ?', [username], async (error, results) => {
        if (error) return res.status(500).json({ message: 'Database error', error });
        if (results.length === 0) return res.status(400).json({ message: 'Invalid username or password' });

        const user = results[0];

        // Validate password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(400).json({ message: 'Invalid username or password' });

        // Generate JWT
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        return res.status(200).json({ 
            token:token,
            message: 'User logged in successfully',

         });
        
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
