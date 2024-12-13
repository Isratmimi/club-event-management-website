const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

// Initialize Express App
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'israt', // Replace with your MySQL password
    database: 'club_event_project' // Replace with your MySQL database name
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Route to handle sign-up requests
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    // Validate request body
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Insert user data into the database
    const sql = 'INSERT INTO User (username, email, password) VALUES (?, ?, ?)';
   db.query(sql, [username, email, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Username or Email already exists.' });
           }
          console.error('Database error:', err);
           return res.status(500).json({ error: 'Internal server error.' });
       }
       res.status(200).json({ message: 'User registered successfully.' });
    });
});


// Endpoint: Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check if both fields are provided
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Query to check user credentials
    const query = 'SELECT * FROM User WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        // Check if a matching user was found
        if (results.length > 0) {
            res.status(200).json({ message: 'Login successful.' });
        } else {
            res.status(401).json({ error: 'Invalid username or password.' });
        }
    });
})




// Club creation endpoint
app.post('/clubs/create', (req, res) => {
    const { name, description, admin_id } = req.body;
  
    // Ensure admin_id is provided in the request
    if (!admin_id) {
      return res.status(400).json({ error: "Admin ID is required." });
    }
  
    const sql = `INSERT INTO Club (name, description, admin_id) VALUES (?, ?, ?)`;
  
    db.query(sql, [name, description, admin_id], (err, result) => {
      if (err) {
        console.error('Error creating club:', err);
        res.status(500).json({ error: 'Error creating club' });
      } else {
        res.status(200).json({ message: 'Club created successfully' });
      }
    });
  });
  
  // Club deletion endpoint
app.delete('/clubs/delete/:id', (req, res) => {
    const clubId = req.params.id;
  
    const sql = `DELETE FROM Club WHERE club_id = ?`;
  
    db.query(sql, [clubId], (err, result) => {
      if (err) {
        console.error('Error deleting club:', err);
        return res.status(500).json({ error: 'Error deleting club' });
      }
  
      if (result.affectedRows === 0) {
        // If no club was found with the given id
        return res.status(404).json({ error: 'Club not found' });
      }
  
      console.log('Club deleted successfully:', result);
      res.status(200).json({ message: 'Club deleted successfully' });
    });
  });
  
  


//fetch club

app.get('/clubs', (req, res) => {
    const query = 'SELECT * FROM Club';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching clubs:', err);
            return res.status(500).json({ error: 'Error fetching clubs' });
        }
        res.json(results); // Send the club data to the frontend
    });
});


//fetch events

app.get('/Event', (req, res) => {
    const query = 'SELECT * FROM Event';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        console.log('Event fetched:', results); // Log the fetched results
        res.json(results);
    });
});





// API endpoint to create an event
app.post('/api/events/create', (req, res) => {
    const { name, date, admin_id, club_id } = req.body;

    if (!name || !date || !admin_id || !club_id) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const event = { name, date, admin_id, club_id };
    const query = 'INSERT INTO Event SET ?';

    db.query(query, event, (err, result) => {
        if (err) {
            console.error('Error inserting event:', err);
            return res.status(500).json({ error: 'Failed to create event' });
        }
        res.status(200).json({ message: 'Event created successfully' });
    });
});




// Update Event
app.put('/api/events/update', (req, res) => {
    const { event_id, name, date, admin_id, club_id } = req.body;
    const query = 'UPDATE Event SET name = ?, date = ?, admin_id = ?, club_id = ? WHERE event_id = ?';

    db.query(query, [name, date, admin_id, club_id, event_id], (err, result) => {
        if (err) {
            console.error('Error updating event:', err);
            return res.status(500).json({ error: 'Error updating event.' });
        }
        res.json({ message: 'Event updated successfully!' });
    });
});

// Delete Event
app.delete('/api/events/delete', (req, res) => {
    const { event_id } = req.body;
    const query = 'DELETE FROM Event WHERE event_id = ?';

    db.query(query, [event_id], (err, result) => {
        if (err) {
            console.error('Error deleting event:', err);
            return res.status(500).json({ error: 'Error deleting event.' });
        }
        res.json({ message: 'Event deleted successfully!' });
    });
});



// Route to handle registration
app.post('/api/register', async (req, res) => {
    const { username, email, password, event_id } = req.body;

    console.log('Received registration data:', { username, email, event_id }); // Add this log

    if (!username || !email || !password || !event_id) {
        console.log('Missing required fields');  // Log missing fields
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        

        // Insert registration data into the database
        const query = 'INSERT INTO Registrations (username, email, password, event_id) VALUES (?, ?, ?, ?)';
        db.query(query, [username, email, password, event_id], (err, result) => {
            if (err) {
                console.error('Error inserting data into database:', err);  // Log SQL error
                return res.status(500).json({ error: 'Database error' });
            }

            console.log('Registration successful:', result);  // Log successful registration
            res.status(200).json({ message: 'Successfully registered!' });
        });
    } catch (error) {
        console.error('Error during registration:', error);  // Log server-side error
        res.status(500).json({ error: 'Server error' });
    }
});





// Fetch users with their club information
app.get('/api/users', (req, res) => {
    const query = `
        SELECT User.user_id, User.username, User.email, Club.club_id
        FROM User
        LEFT JOIN Joins ON User.user_id = Joins.user_id
        LEFT JOIN Club ON Joins.club_id = Club.club_id;
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Failed to fetch users' });
        } else {
            res.json(results);
        }
    });
});

// Delete a user
app.delete('/api/users/delete', (req, res) => {
    const { user_id } = req.body;
    const query = 'DELETE FROM User WHERE user_id = ?';

    db.query(query, [user_id], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            res.status(500).json({ error: 'Failed to delete user' });
        } else {
            res.json({ message: 'User successfully removed' });
        }
    });
});



// Fetch club expenses to show budget overview
app.get('/api/club/expenses', (req, res) => {
    const query = 'SELECT SUM(amount) AS totalExpenses FROM club_expenses';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching expenses:', err);
            res.status(500).json({ error: 'Failed to fetch expenses' });
        } else {
            res.json({ totalExpenses: results[0].totalExpenses });
        }
    });
});


// Submit a funding request
app.post('/api/funding/requests', (req, res) => {
    const { amount_requested, funding_purpose } = req.body;
    const query = 'INSERT INTO funding_requests (amount_requested, funding_purpose) VALUES (?, ?)';

    db.query(query, [amount_requested, funding_purpose], (err, result) => {
        if (err) {
            console.error('Error submitting funding request:', err);
            res.status(500).json({ error: 'Failed to submit funding request' });
        } else {
            res.json({ message: 'Funding request submitted successfully' });
        }
    });
});



// API route to join a club
app.post('/api/join-club', (req, res) => {
    const { club_id, user_id, membership_type } = req.body;

    if (!club_id || !user_id || !membership_type) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const checkMembershipQuery = 'SELECT * FROM Joins WHERE club_id = ? AND user_id = ?';
    const addMembershipQuery = 'INSERT INTO Joins (club_id, user_id, membership_type) VALUES (?, ?, ?)';

    // Check if the user is already a member of the club
    db.query(checkMembershipQuery, [club_id, user_id], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ success: false, message: 'An error occurred while checking membership.' });
        }

        if (results.length > 0) {
            return res.status(400).json({ success: false, message: 'You are already a member of this club.' });
        }

        // Add new membership
        db.query(addMembershipQuery, [club_id, user_id, membership_type], (err, results) => {
            if (err) {
                console.error('Error adding membership:', err);
                return res.status(500).json({ success: false, message: 'An error occurred while joining the club.' });
            }

            return res.status(200).json({ success: true, message: 'Successfully joined the club.' });
        });
    });
});







// Start the Server
app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});