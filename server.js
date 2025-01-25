const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config(); // To load environment variables from a .env file

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON requests
app.use(express.static('public')); // Serve static files from the 'public' folder

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root', // Replace with your MySQL username
  password: process.env.DB_PASSWORD || 'admin', // Replace with your MySQL password
  database: process.env.DB_NAME || 'login', // Replace with your MySQL database name
});

// Connect to the database
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database!');
});

// Register Route
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  // Check if the user already exists
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error checking user' });
    if (results.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ message: 'Error hashing password' });

      // Insert new user into the database
      const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      db.query(sql, [name, email, hashedPassword], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error registering user' });
        res.status(201).json({ message: 'User registered successfully' });
      });
    });
  });
});

// Login Route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Check if the user exists
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error checking user' });
    if (results.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = results[0]; // Get the first matching user

    // Compare the password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: 'Error comparing passwords' });
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      res.json({ message: 'Login successful' });
    });
  });
});

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Error Handling Middleware (Optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An unexpected error occurred!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
