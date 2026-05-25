import React, { useState, useEffect } from 'react'; // <-- Added useEffect
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function Home() {
  const navigate = useNavigate();

  // --- NEW SEARCH MODAL STATES ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);


  // --- NEW SEARCH FUNCTION ---
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // We are giving React the absolute, exact path to your Flask route
const response = await fetch(`http://127.0.0.1:5000/api/patients/search?q=${query}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.patients);
      }
    } catch (error) {
      console.error("Failed to search patients:", error);
    }
    setIsSearching(false);
  };

  // --- NEW: DYNAMIC DASHBOARD STATS ---
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalScans: 0,
    criticalAlerts: 0,
    recentPatients: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/stats');
        const data = await response.json();
        if (data.success) {
          setStats({
            totalPatients: data.total_patients,
            totalScans: data.total_scans,
            criticalAlerts: data.critical_alerts,
            recentPatients: data.recent_activity || []
          });
        }
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      }
    };
    fetchStats();
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sparklineData1 = [{ v: 20 }, { v: 45 }, { v: 30 }, { v: 60 }, { v: 55 }, { v: 80 }];
  const sparklineData2 = [{ v: 80 }, { v: 60 }, { v: 75 }, { v: 40 }, { v: 50 }, { v: 30 }];

  const recentPatients = [
    { id: 1, name: "Ali Hasan", mrn: "WK-IN-1042", date: "Apr 26, 2026", risk: 85, status: "Critical" },
    { id: 2, name: "Huzaifa Shah", mrn: "WK-IN-1041", date: "Apr 25, 2026", risk: 42, status: "Review" },
    { id: 3, name: "Syed Muhammad Saad", mrn: "WK-IN-1040", date: "Apr 25, 2026", risk: 12, status: "Stable" },
    { id: 4, name: "Naheeda Zubair", mrn: "WK-IN-1039", date: "Apr 24, 2026", risk: 76, status: "Critical" },
    { id: 5, name: "Zubair Chandio", mrn: "WK-IN-1038", date: "Apr 24, 2026", risk: 28, status: "Stable" }
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-800 flex flex-col relative">
      
      {/* 1. DARK, SLEEK HEADER */}
      <nav className="bg-[#0B132B] text-white px-8 py-4 flex justify-between items-center shadow-md z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-[#4A00E0] to-[#8E2DE2] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nephro<span className="text-[#00D2FF]">AI</span></h1>
            <p className="text-[10px] text-[#A0AABF] font-bold uppercase tracking-widest mt-0.5">Diagnostic Command Center</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-[#E0E6ED]">{today}</p>
            <p className="text-xs text-[#8E2DE2] font-bold flex items-center justify-end gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#00D2FF] animate-pulse"></span>
              SYSTEM ACTIVE
            </p>
          </div>
          <div className="flex items-center gap-3 bg-[#1C2541] px-4 py-2 rounded-xl border border-[#3A506B] cursor-pointer hover:bg-[#2B3A5A] transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#00D2FF] text-[#0B132B] flex items-center justify-center font-bold text-sm shadow-sm">SJ</div>
            <div className="text-sm text-left">
              <p className="font-bold text-white leading-tight">Dr. Usama Mushtaq</p>
            </div>
            <svg className="w-4 h-4 text-[#A0AABF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* 2. STATS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Patients Registered</p>
               <p className="text-3xl font-bold text-[#0B132B] mt-1">{stats.totalPatients}</p>
              </div>
              <div className="p-2 bg-[#F0F4F8] rounded-lg text-[#0078D4]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
            </div>
            <div className="h-12 w-full absolute bottom-0 left-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData1}>
                  <Area type="monotone" dataKey="v" stroke="#00D2FF" fill="#00D2FF" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Scans Analyzed</p>
             <p className="text-3xl font-bold text-[#0B132B] mt-1">{stats.totalScans}</p>
              </div>
              <div className="p-2 bg-[#F0F4F8] rounded-lg text-[#8E2DE2]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
            </div>
             <div className="h-12 w-full absolute bottom-0 left-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData1}>
                  <Area type="monotone" dataKey="v" stroke="#8E2DE2" fill="#8E2DE2" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0B132B] p-6 rounded-2xl shadow-lg shadow-blue-900/20 border border-[#1C2541] flex flex-col justify-between relative overflow-hidden text-white">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-semibold text-[#8E2DE2] uppercase tracking-wider">Critical Alerts</p>
                <p className="text-4xl font-bold text-white mt-1">{stats.criticalAlerts}</p>
                <p className="text-xs text-[#A0AABF] mt-2">Requires immediate review</p>
              </div>
              <div className="p-2 bg-[#FF007F]/20 rounded-lg text-[#FF007F]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
            </div>
             <div className="h-16 w-full absolute bottom-0 left-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData2}>
                  <Area type="monotone" dataKey="v" stroke="#FF007F" fill="#FF007F" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. QUICK ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <button 
            onClick={() => navigate('/register')}
            className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D2FF] to-[#0078D4] text-white flex items-center justify-center shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-[#0B132B]">New Patient Profile</h3>
                <p className="text-slate-500 text-sm">Register demographics & baseline</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#00D2FF] group-hover:text-white group-hover:border-transparent transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </button>

          <button 
            onClick={() => setIsSearchOpen(true)}
            className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8E2DE2] to-[#4A00E0] text-white flex items-center justify-center shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-[#0B132B]">Run Diagnostics Engine</h3>
                <p className="text-slate-500 text-sm">Search database & process models</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#8E2DE2] group-hover:text-white group-hover:border-transparent transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </button>
        </div>

        {/* 4. RECENT ACTIVITY TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <h3 className="text-sm font-bold text-[#0B132B] uppercase tracking-wider flex items-center gap-2">
              Recent Inferences
            </h3>
            <button className="text-sm font-bold text-[#0078D4] hover:text-[#0B132B] transition-colors">View All Directory</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4 font-bold">Patient</th>
                  <th className="px-6 py-4 font-bold">MRN</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Risk Score</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
             <tbody className="text-sm divide-y divide-slate-100">
                {stats.recentPatients && stats.recentPatients.length > 0 ? (
                  stats.recentPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-[#0B132B]">{patient.name}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{patient.mrn}</td>
                      <td className="px-6 py-4 text-slate-500">{patient.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`font-bold ${patient.risk > 70 ? 'text-[#FF007F]' : patient.risk > 30 ? 'text-[#8E2DE2]' : 'text-[#00D2FF]'}`}>
                            {patient.risk}%
                          </span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${patient.risk > 70 ? 'bg-[#FF007F]' : patient.risk > 30 ? 'bg-[#8E2DE2]' : 'bg-[#00D2FF]'}`} 
                              style={{ width: `${patient.risk}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                          patient.status === 'Critical' ? 'bg-[#FF007F]/10 text-[#FF007F]' : 
                          patient.status === 'Review' ? 'bg-[#8E2DE2]/10 text-[#8E2DE2]' : 
                          'bg-[#00D2FF]/10 text-[#0078D4]'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => navigate('/dashboard', { state: { selectedPatient: patient.patient_data } })}
                          className="text-[#0078D4] font-bold text-sm hover:text-[#0B132B] transition-colors"
                        >
                          Open Dashboard
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 italic">
                      No recent patient scans found in the database. Run a diagnostic to see it appear here!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. THE SEARCH MODAL (POPUP) */}
        {isSearchOpen && (
          <div className="fixed inset-0 bg-[#0B132B]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C2541] w-full max-w-lg rounded-2xl shadow-2xl border border-[#3A506B] overflow-hidden flex flex-col">
              
              <div className="p-6 border-b border-[#3A506B]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Find Patient Record</h3>
                  <button 
                    onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                    className="text-[#A0AABF] hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#A0AABF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={handleSearch}
                    placeholder="Enter patient name or MRN (e.g., WK-IN)..."
                    className="w-full bg-[#0B132B] text-white border border-[#3A506B] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#00D2FF] focus:ring-1 focus:ring-[#00D2FF] transition-all"
                  />
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {isSearching ? (
                  <p className="text-center text-[#A0AABF] py-8 font-medium">Searching database...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        navigate('/dashboard', { state: { selectedPatient: patient } });
                      }}
                      className="w-full text-left p-4 hover:bg-[#2B3A5A] rounded-xl transition-colors flex justify-between items-center group"
                    >
                      <div>
                        <p className="font-bold text-white group-hover:text-[#00D2FF] transition-colors">{patient.name}</p>
                        <p className="text-xs text-[#A0AABF] font-mono mt-1">MRN: {patient.mrn} • Age: {patient.age} • Sex: {patient.sex === 1 ? 'Male' : 'Female'}</p>
                      </div>
                      <svg className="w-5 h-5 text-[#3A506B] group-hover:text-[#00D2FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <p className="text-center text-[#A0AABF] py-8">No matching patients found.</p>
                ) : (
                  <p className="text-center text-[#A0AABF] py-8 text-sm">Type at least 2 characters to search.</p>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}