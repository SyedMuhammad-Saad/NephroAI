import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const navigate = useNavigate();
  
  // 1. Set up state to hold what the user types and any error messages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. THE REAL LOGIN LOGIC
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(''); // Clear old errors

    try {
      // Send the email and password to your new Flask route
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // 🎉 The backend said the password is correct! Teleport to Home!
        navigate('/home');
      } else {
        // ❌ The backend said the password is wrong. Show the error.
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error("Login failed:", error);
      setErrorMessage("Could not connect to the server. Is Flask running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center relative overflow-hidden">
        
        {/* Background shapes */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-50 rounded-full"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-50 rounded-full opacity-60"></div>
        
        {/* Header */}
        <div className="text-center mb-10 z-10">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4A00E0] to-[#8E2DE2] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0B132B] tracking-tight">
              Nephro<span className="text-[#0078D4]">AI</span>
            </h1>
          </div>
          <p className="text-xl font-bold text-slate-800">Welcome Back</p>
          <p className="text-gray-500 text-sm mt-1">Sign in to your Diagnostic Command Center</p>
        </div>

        {/* --- ERROR MESSAGE DISPLAY --- */}
        {errorMessage && (
          <div className="w-full bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center z-10 border border-red-100 font-medium">
            {errorMessage}
          </div>
        )}

        {/* The Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-5 z-10">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@nephroai.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00D2FF] focus:ring-1 focus:ring-[#00D2FF] transition-all" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00D2FF] focus:ring-1 focus:ring-[#00D2FF] transition-all" 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#4A00E0] to-[#8E2DE2] hover:from-[#0B132B] hover:to-[#0B132B] text-white font-bold py-3.5 rounded-lg shadow-lg shadow-purple-500/20 transition-all duration-300 disabled:opacity-70"
          >
            {isLoading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}