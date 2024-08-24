require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./config/db'); // Correctly imported

require('./models/userModel');
require('./models/kpiModel');

const app = express();
app.use(express.json());
app.use(cors());

// Register a new user (for initial setup)
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (email, password) VALUES (?, ?)',
            [email, hashedPassword],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ message: 'Email already exists' });
                    }
                    return res.status(500).json({ message: 'Database error', error: err });
                }
                res.status(201).json({ message: 'User registered successfully' });
            }
        );
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        if (results.length === 0)
            return res.status(400).json({ message: 'Invalid email or password' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ message: 'Login successful', token });
    });
});

// Protected route to get KPI data
app.get('/api/kpi-data', authenticateToken, (req, res) => {
    db.query('SELECT * FROM kpi_data', (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.json(results);
    });
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access token missing' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid access token' });
        req.user = user;
        next();
    });
}

// Endpoint to fetch real-time data from external API


app.get('/api/real-time-data', authenticateToken, (req, res) => {
    const realTimeData = [
        { id: 1, name: 'Active Users', value: 120 },
        { id: 2, name: 'Server Load', value: '75%' },
        { id: 3, name: 'Response Time', value: '200ms' },
    ];
    res.json(realTimeData);
});



// Insert KPI data
app.post('/api/kpi-data', authenticateToken, (req, res) => {
    const { title, value, target, achievement } = req.body;

    if (!title || !value || !target || achievement === undefined) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const insertQuery = `
        INSERT INTO kpi_data (title, value, target, achievement)
        VALUES (?, ?, ?, ?)
    `;

    db.query(insertQuery, [title, value, target, achievement], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err });
        res.status(201).json({ message: 'KPI data inserted successfully', id: result.insertId });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
