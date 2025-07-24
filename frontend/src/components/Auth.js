import React, { useState } from 'react';

// This component receives the login/register functions as "props" (properties) from App.js
function Auth({ handleLogin, handleRegister, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const onRegister = (e) => {
    e.preventDefault();
    handleRegister(email, password);
  };

  return (
    <div className="auth-container">
      <h2>Login or Register</h2>
      <form>
        <div className="person-form">
            <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="auth-input"
            />
            <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="auth-input"
            />
            <div className="button-group">
                <button onClick={onLogin} className="auth-button">Login</button>
                <button onClick={onRegister} className="auth-button register">Register</button>
            </div>
        </div>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Auth;
