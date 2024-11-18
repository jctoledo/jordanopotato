// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function Login({ setUserId, setSummary }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (username.trim() === '') {
      setError('Username cannot be empty.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username });
      setUserId(response.data.user_id);
      setSummary(response.data.summary);
      navigate('/chat');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Login</h1>
      <input
        type="text"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          setError('');
        }}
        placeholder="Enter your name"
        style={{ padding: '10px', width: '200px' }}
      />
      <br />
      <button onClick={handleLogin} style={{ padding: '10px 20px', marginTop: '10px' }}>
        Login
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}

export default Login;
