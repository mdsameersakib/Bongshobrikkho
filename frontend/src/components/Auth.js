import React, { useState } from 'react';

// This component now manages its own display mode (login or register)
function Auth({ handleLogin, handleRegister, error, loading }) {
  // State to toggle between login and register modes
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

  // --- NEW: State for additional user details ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const onLogin = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const onRegister = (e) => {
    e.preventDefault();
    // Pass the new details to the handler function
    handleRegister(email, password, invitationCode, { firstName, lastName, birthDate });
  };
  
  // --- NEW: Condition to show detailed fields ---
  const showDetailFields = isRegisterMode && !invitationCode;

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
            required
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
            required
          />
        </div>

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
        
        {/* --- NEW: Conditionally rendered detail fields --- */}
        {showDetailFields && (
            <div className="space-y-4 pt-4 border-t">
                 <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    required
                 />
                 <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                 />
                 <div>
                    <label htmlFor="birthDate" className="text-sm text-gray-500 px-1">Birthdate</label>
                    <input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                 </div>
            </div>
        )}


        {/* Action Buttons */}
        <div className="button-group space-y-3">
          {isRegisterMode ? (
            <button onClick={onRegister} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors disabled:bg-gray-400">
              {loading ? 'Registering...' : 'Register'}
            </button>
          ) : (
            <button onClick={onLogin} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-colors disabled:bg-gray-400">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          )}
        </div>
      </form>

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