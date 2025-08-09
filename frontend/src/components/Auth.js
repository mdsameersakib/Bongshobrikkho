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
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-950 p-8 rounded-xl shadow-card border border-slate-200 dark:border-slate-800">
      <h2 className="text-3xl font-bold text-accent text-center mb-6">
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
            className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-accent/60 focus:border-transparent transition text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
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
            className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-accent/60 focus:border-transparent transition text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
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
              className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg focus:ring-2 focus:ring-accent/60 focus:border-transparent transition text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
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
          className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-100"
                    required
                 />
                 <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
          className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-100"
                 />
                 <div>
                    <label htmlFor="birthDate" className="text-sm text-gray-500 px-1">Birthdate</label>
                    <input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                 </div>
            </div>
        )}


        {/* Action Buttons */}
        <div className="button-group space-y-3">
          {isRegisterMode ? (
            <button onClick={onRegister} disabled={loading} className="w-full btn btn-primary py-3 font-bold disabled:opacity-50">
              {loading ? 'Registering...' : 'Register'}
            </button>
          ) : (
            <button onClick={onLogin} disabled={loading} className="w-full btn bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-3 shadow-sm disabled:opacity-50">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 text-center">
        {isRegisterMode ? (
          <p className="text-slate-600 dark:text-slate-300">
            Already have an account?{' '}
            <button onClick={() => setIsRegisterMode(false)} className="text-accent hover:underline font-semibold focus:outline-none">
              Login
            </button>
          </p>
        ) : (
          <p className="text-slate-600 dark:text-slate-300">
            Don't have an account?{' '}
            <button onClick={() => setIsRegisterMode(true)} className="text-accent hover:underline font-semibold focus:outline-none">
              Register
            </button>
          </p>
        )}
      </div>

  {error && <p className="text-rose-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );
}

export default Auth;