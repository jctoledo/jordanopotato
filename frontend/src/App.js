// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Chat from './Chat';
import Login from './Login'; // Import the Login component

function App() {
  const [userId, setUserId] = useState(null);
  const [summary, setSummary] = useState('');

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<Login setUserId={setUserId} setSummary={setSummary} />}
        />
        <Route
          path="/chat"
          element={<Chat userId={userId} summary={summary} />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
