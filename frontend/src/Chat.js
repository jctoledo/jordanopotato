// Chat.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

function Chat({ userId, summary }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [localSummary, setLocalSummary] = useState(summary);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      // Redirect to login if no userId
      navigate('/login');
    } else {
      // Initialize messages with summary or default message
      setMessages([
        { sender: 'AI Psychologist', text: summary || 'Hello! How can I assist you today?' },
      ]);
    }
  }, [userId, navigate, summary]);

  useEffect(() => {
    // Load the current prompt
    if (userId) {
      fetchPrompt();
    }
  }, [userId]);

  const fetchPrompt = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/prompt/${userId}`);
      setPrompt(response.data);
    } catch (error) {
      console.error('Error fetching prompt:', error);
      setError('Failed to fetch prompt.');
    }
  };

  const updatePrompt = async () => {
    try {
      await axios.post(`${API_BASE_URL}/prompt/${userId}`, { new_prompt: prompt });
      setIsEditingPrompt(false);
    } catch (error) {
      console.error('Error updating prompt:', error);
      setError('Failed to update prompt.');
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/summary/${userId}`);
      setLocalSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setError('Failed to fetch summary.');
    }
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { sender: 'You', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: input,
        user_id: userId,
      });

      const aiMessage = {
        sender: 'AI Psychologist',
        text: response.data.reply,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message.');
      const errorMessage = {
        sender: 'AI Psychologist',
        text: 'Sorry, there was an error processing your request.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AI Psychologist Chat</h1>
      <div style={styles.promptSection}>
        <h2 style={styles.sectionTitle}>Current Prompt</h2>
        {isEditingPrompt ? (
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={styles.textarea}
          />
        ) : (
          <p style={styles.promptText}>{prompt}</p>
        )}
        <button
          onClick={isEditingPrompt ? updatePrompt : () => setIsEditingPrompt(true)}
          style={styles.button}
        >
          {isEditingPrompt ? 'Save Prompt' : 'Edit Prompt'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf: msg.sender === 'You' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'You' ? '#DCF8C6' : '#FFF',
            }}
          >
            <strong>{msg.sender}:</strong>
            <p style={styles.messageText}>{msg.text}</p>
          </div>
        ))}
        {isLoading && (
          <div style={styles.loading}>
            <em>Typing...</em>
          </div>
        )}
      </div>
      <div style={styles.inputContainer}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Type your message..."
          style={styles.textarea}
        />
        <button onClick={sendMessage} style={styles.sendButton} disabled={isLoading}>
          Send
        </button>
      </div>
      <div style={styles.summarySection}>
        <h2 style={styles.sectionTitle}>Conversation Summary</h2>
        <button onClick={fetchSummary} style={styles.button}>
          Refresh Summary
        </button>
        <p style={styles.summaryText}>{localSummary || 'No summary available yet.'}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '600px',
    margin: '50px auto',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    backgroundColor: '#F9F9F9',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    padding: '20px',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px',
  },
  promptSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    marginBottom: '10px',
  },
  promptText: {
    backgroundColor: '#FFF',
    padding: '10px',
    border: '1px solid #CCC',
    borderRadius: '5px',
    marginBottom: '10px',
  },
  chatBox: {
    display: 'flex',
    flexDirection: 'column',
    height: '400px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '15px',
    overflowY: 'scroll',
    backgroundColor: '#FFF',
    marginBottom: '15px',
  },
  message: {
    margin: '10px 0',
    padding: '10px',
    borderRadius: '10px',
    maxWidth: '70%',
    lineHeight: '1.4',
  },
  inputContainer: {
    display: 'flex',
    gap: '10px',
  },
  textarea: {
    flex: 1,
    padding: '10px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    resize: 'none',
    height: '50px',
  },
  sendButton: {
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: '#FFF',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  loading: {
    alignSelf: 'flex-start',
    color: '#888',
    fontStyle: 'italic',
  },
  summarySection: {
    marginTop: '20px',
  },
  summaryText: {
    marginTop: '10px',
    backgroundColor: '#FFF',
    padding: '10px',
    border: '1px solid #CCC',
    borderRadius: '5px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#28A745',
    color: '#FFF',
    cursor: 'pointer',
    marginTop: '10px',
  },
};

export default Chat;
