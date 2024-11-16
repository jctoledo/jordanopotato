// src/Chat.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function Chat() {
  const [messages, setMessages] = useState([
    { sender: 'AI Psychologist', text: 'Hello! How can I assist you today?' },
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Generate a unique session ID
    const id = uuidv4();
    setSessionId(id);
  }, []);

  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { sender: 'You', text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: input,
        session_id: sessionId,
      });

      const aiMessage = {
        sender: 'AI Psychologist',
        text: response.data.reply,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        sender: 'AI Psychologist',
        text: 'Sorry, there was an error processing your request.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setInput('');
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSendClick = () => {
    sendMessage();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div style={styles.container}>
      <h1>AI Psychologist Chat</h1>
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
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          style={styles.input}
        />
        <button onClick={handleSendClick} style={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '500px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  chatBox: {
    display: 'flex',
    flexDirection: 'column',
    height: '400px',
    border: '1px solid #ccc',
    padding: '10px',
    overflowY: 'scroll',
    marginBottom: '10px',
  },
  message: {
    margin: '5px 0',
    padding: '10px',
    borderRadius: '10px',
    maxWidth: '70%',
  },
  inputContainer: {
    display: 'flex',
  },
  input: {
    flex: 1,
    padding: '10px',
    fontSize: '16px',
  },
  sendButton: {
    padding: '10px 20px',
    fontSize: '16px',
    marginLeft: '5px',
  },
};

export default Chat;