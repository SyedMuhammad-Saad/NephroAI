import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PatientHub() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // <-- New state for success message
  
  const [newPatient, setNewPatient] = useState({
    name: '',
    mrn: '',
    age: '',
    sex: ''
  });

  const handleChange = (e) => {
    setNewPatient({ ...newPatient, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsRegistering(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });

      const data = await response.json();

      if (response.ok) {
        // Show the success message on the screen
        setSuccess(true);

        // Build the EXACT object the Dashboard is expecting
        const fullPatientData = {
          id: data.patient_id,
          name: newPatient.name,
          mrn: newPatient.mrn,
          age: parseInt(newPatient.age),
          // Convert sex string back to a number for the dashboard
          sex: parseInt(newPatient.sex) 
        };

        // Wait 1.5 seconds so the user can read the success message, then teleport
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { 
              selectedPatient: fullPatientData // <-- Passing the baton correctly!
            } 
          });
        }, 1500);

      } else {
        setError(data.message || 'Failed to register patient.');
        setIsRegistering(false);
      }
    } catch (err) {
      setError('Cannot connect to the server. Is Python running?');
      setIsRegistering(false);
    }
  }; 

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 relative overflow-hidden">
        
        {/* If successful, we show a green overlay! */}
        {success && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Patient Registered!</h2>
            <p className="text-gray-500 text-sm mt-2">Loading Diagnostic Engine...</p>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">NephroAI</h1>
          <p className="text-gray-500 text-sm mt-2">Register a Patient</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" name="name" onChange={handleChange} required className="mt-1 w-full p-2 border rounded" placeholder="e.g., Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Medical Record Number (MRN)</label>
            <input type="text" name="mrn" onChange={handleChange} required className="mt-1 w-full p-2 border rounded" placeholder="e.g., MRN-12345" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input type="number" name="age" onChange={handleChange} required className="mt-1 w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sex</label>
              <select name="sex" onChange={handleChange} required className="mt-1 w-full p-2 border rounded">
                <option value="">Select...</option>
                <option value="1">Male (1)</option>
                <option value="0">Female (0)</option>
              </select>
            </div> 
          </div>
          
          <button type="submit" disabled={isRegistering} className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
            {isRegistering ? 'Saving to Database...' : 'Register & Start Diagnosis'}
          </button>
        </form>

      </div>
    </div>
  );
}