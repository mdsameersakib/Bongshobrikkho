import React, { useState } from 'react';

// This component now manages its own display mode (login or register)
function Auth({ handleLogin, handleRegister, error }) {
  // State to toggle between login and register modes
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

  const onLogin = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const onRegister = (e) => {
    e.preventDefault();
    handleRegister(email, password, invitationCode);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-teal-700 text-center mb-6">
        {isRegisterMode ? 'Register' : 'Login'}
      </h2>

      <form className="space-y-5">
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            aria-label="Email address"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            aria-label="Password"
          />
        </div>

        {/* Invitation Code field, visible only in Register mode */}
        {isRegisterMode && (
          <div>
            <label htmlFor="invitationCode" className="sr-only">Invitation Code</label>
            <input
              id="invitationCode"
              type="text"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              placeholder="Invitation Code (Optional)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              aria-label="Invitation Code"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="button-group space-y-3">
          {isRegisterMode ? (
            <button onClick={onRegister} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors">
              Register
            </button>
          ) : (
            <button onClick={onLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors">
              Login
            </button>
          )}
        </div>
      </form>

      {/* Toggle between Login and Register modes */}
      <div className="mt-6 text-center">
        {isRegisterMode ? (
          <p className="text-gray-700">
            Already have an account?{' '}
            <button onClick={() => setIsRegisterMode(false)} className="text-blue-600 hover:underline font-semibold focus:outline-none">
              Login
            </button>
          </p>
        ) : (
          <p className="text-gray-700">
            Don't have an account?{' '}
            <button onClick={() => setIsRegisterMode(true)} className="text-teal-600 hover:underline font-semibold focus:outline-none">
              Register
            </button>
          </p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );
}

export default Auth;
