const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static('public'));

// API endpoint for user data
app.get('/api/users', (req, res) => {
  try {
    const usersPath = path.join(__dirname, 'public', 'users.json');
    if (fs.existsSync(usersPath)) {
      const userData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      res.json(userData);
    } else {
      res.json({ error: 'No user data available' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load user data' });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
});
