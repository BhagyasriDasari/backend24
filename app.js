const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 4000;

// Create a new database file or connect to an existing one
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the users database.");
    // Create a users table if it does not exist
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL
      )
    `);
  }
});

// Middleware for parsing JSON body
app.use(express.json());

// API endpoint for creating a new user
app.post("/users", (req, res) => {
  const { username, email, password } = req.body;

  // Insert user data into the users table
  db.run(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, password],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send("Failed to insert user data.");
      } else {
        console.log(`User ${this.lastID} inserted successfully!`);
        res.status(201).send("User created successfully.");
      }
    }
  );
});

// API endpoint for getting all users
app.get("/users", (req, res) => {
  // Retrieve all rows from the users table
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to retrieve user data.");
    } else {
      console.log(`Retrieved ${rows.length} users.`);
      res.status(200).json(rows);
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
