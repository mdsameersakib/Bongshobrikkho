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
    <div className="w-full mx-auto">
      <h2 className="text-xl font-semibold tracking-tight text-center mb-6 text-slate-800 dark:text-white">
        {isRegisterMode ? 'Create your account' : 'Sign in'}
      </h2>

      <form className="space-y-5" onSubmit={isRegisterMode ? onRegister : onLogin}>
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:focus:ring-slate-500/40 text-slate-900 dark:text-slate-100"
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
            className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:focus:ring-slate-500/40 text-slate-900 dark:text-slate-100"
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
              className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:focus:ring-slate-500/40 text-slate-900 dark:text-slate-100"
              aria-label="Invitation Code"
            />
          </div>
        )}
        
        {/* --- NEW: Conditionally rendered detail fields --- */}
        {showDetailFields && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:focus:ring-slate-500/40 text-slate-900 dark:text-slate-100"
                required
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:focus:ring-slate-500/40 text-slate-900 dark:text-slate-100"
              />
              <div>
                <label htmlFor="birthDate" className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">Birthdate</label>
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:focus:ring-slate-500/40 mt-1 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
        )}


        {/* Action Buttons */}
        <div className="pt-2">
          <button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-700 dark:hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (isRegisterMode ? 'Registering...' : 'Logging in...') : (isRegisterMode ? 'Create Account' : 'Sign In')}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        {isRegisterMode ? (
          <p className="text-slate-600 dark:text-slate-300 text-xs">
            Already have an account?{' '}
            <button type="button" onClick={() => setIsRegisterMode(false)} className="text-slate-800 dark:text-white font-medium hover:underline">
              Sign in
            </button>
          </p>
        ) : (
          <p className="text-slate-600 dark:text-slate-300 text-xs">
            Don't have an account?{' '}
            <button type="button" onClick={() => setIsRegisterMode(true)} className="text-slate-800 dark:text-white font-medium hover:underline">
              Create one
            </button>
          </p>
        )}
      </div>

  {error && <p className="text-red-500 dark:text-red-400 text-xs mt-4 text-center">{error}</p>}
    </div>
  );
}

export default Auth;