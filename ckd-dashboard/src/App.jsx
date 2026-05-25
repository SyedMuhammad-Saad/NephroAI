import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import our new Home page alongside the others!
import Home from './pages/Home'; 
import PatientHub from './pages/PatientHub'; 
import Dashboard from './pages/Dashboard'; 
import Auth from  './pages/Auth';
export default function App() {
  return (
    <Router>
      <Routes>

        {/* 0. MAKE AUTH THE DEFAULT PAGE */}
        <Route path="/" element={<Auth />} />

      {/* 2. Home is now specifically at (/home) */}
        <Route path="/home" element={<Home />} />
        
        {/* 2. REGISTRATION PAGE: The old form is safely moved here */}
        <Route path="/register" element={<PatientHub />} />
        
        {/* 3. THE AI DASHBOARD: Where the magic happens */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}