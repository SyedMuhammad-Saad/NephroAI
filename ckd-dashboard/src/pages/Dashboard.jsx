import React, { useState, useEffect } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import Chatbot from '../components/Chatbot';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the patient from the "baton pass". If no patient was passed, it will be null.
  const activePatient = location.state?.selectedPatient;
  const patientId = location.state?.patientId;
  const [imageAnalysis, setImageAnalysis] = useState(null);

 const [formData, setFormData] = useState({
    Sex: activePatient?.sex !== undefined ? activePatient.sex.toString() : '', 
    Age: activePatient?.age || '', 
    Haemoglobin: '', Hematocrit: '', Lymphocytes: '',
    MCH: '', MCHC: '', MCV: '', Monocytes: '', MPV: '', PCT: '', PDW: '',
    PlateletCount: '', Polymorphs: '', RBCCount: '', RDWSD: '', WBCCount: '',
    Eosinophils: '', Creatinine: '', Urea: '', GFR: ''
  });
  // --- NEW: AUTO-FILL HISTORICAL DATA ---
 // --- NEW: AUTO-FILL HISTORICAL DATA (BULLETPROOF VERSION) ---
  // --- NEW: AUTO-FILL HISTORICAL DATA ---
  useEffect(() => {
    const fetchLatestRecord = async () => {
      if (!activePatient) return;
      
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/patients/${activePatient.id}/latest`);
        const result = await response.json();
        
        if (result.success && result.has_record) {
          // Because your data is perfectly formatted, we can just inject it directly!
          setFormData(prevData => ({
            ...prevData,
            ...result.data
          }));
        }
      } catch (error) {
        console.error("Error fetching patient history:", error);
      }
    };

    fetchLatestRecord();
  }, [activePatient]);

  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  
  const [riskScore, setRiskScore] = useState(0); 
  const [shapData, setShapData] = useState(null);
  const [diceData, setDiceData] = useState(null);
  const [similarityData, setSimilarityData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDiagnose = async (e) => { 
    e.preventDefault(); 
    setIsProcessing(true);
    
    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      payload.append(key, formData[key]);
    });
    
    if (image) payload.append('image', image);
    // We force React to use the ID of the active patient we are looking at!
if (activePatient?.id) payload.append("patientId", activePatient.id);

    try {
      const response = await fetch('http://localhost:5000/api/diagnose', {
        method: 'POST',
        body: payload, 
      });

      const data = await response.json(); 
      if (data.status === 'success') {
        setRiskScore(data.riskScore); 
        setShapData(data.shapData);
        setDiceData(data.counterfactuals);
        setSimilarityData(data.similarPatients);
        setImageAnalysis(data.imageAnalysis);
        setHasResults(true);
      } else {
        alert("The AI Engine encountered an error.");
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("Failed to connect to the backend.");
    } finally {
      setIsProcessing(false);
    }
  }; 

  // ==========================================
  // VIEW 2: THE UNIFIED RESULTS DASHBOARD
  // ==========================================
  if (hasResults) {
    const isHighRisk = riskScore >= 75;
    const isMedRisk = riskScore >= 50 && riskScore < 75;
    
    // Premium Microsoft-esque color palette
    const riskColorText = isHighRisk ? 'text-[#D13438]' : (isMedRisk ? 'text-[#CA5010]' : 'text-[#107C10]'); 
    const riskColorBg = isHighRisk ? 'bg-[#FDE7E9]' : (isMedRisk ? 'bg-[#FDF3E6]' : 'bg-[#DFF6DD]');
    const riskBadgeColor = isHighRisk ? 'bg-[#D13438] text-white' : (isMedRisk ? 'bg-[#CA5010] text-white' : 'bg-[#107C10] text-white');

    return (
      <div className="min-h-screen bg-[#F3F2F1] text-[#323130] font-sans flex flex-col items-center py-8">
        
        {/* Main Dashboard Container */}
        <div className="w-full max-w-[1400px] bg-white shadow-sm rounded-md flex flex-col overflow-hidden border border-[#EDEBE9]">
          
          {/* Top Header Strip */}
          <div className="bg-[#FAFAFA] border-b border-[#EDEBE9] px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-[#0078D4] flex items-center justify-center rounded-sm">
                <span className="text-white font-bold">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#201F1E] leading-tight">Clinical Diagnostic Report</h1>
                <p className="text-xs text-[#605E5C]">Patient: <span className="font-bold text-[#323130]">{activePatient?.name || 'Walk-in'}</span> • ID: {activePatient?.mrn || patientId || 'N/A'} • {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <button 
              onClick={() => setHasResults(false)} 
              className="text-[#0078D4] text-sm font-semibold hover:bg-[#F3F2F1] px-4 py-2 rounded transition-colors border border-transparent hover:border-[#EDEBE9]"
            >
              ← Modify Clinical Data
            </button>
          </div>

          {/* Core Content Grid */}
          <div className="flex flex-col lg:flex-row min-h-[700px]">
            
            {/* LEFT COLUMN: Summary & Patient (Fixed Width) */}
            <div className="w-full lg:w-[350px] border-r border-[#EDEBE9] bg-[#FAFAFA] flex flex-col">
              
              {/* Risk Assessment Box */}
              <div className="p-8 border-b border-[#EDEBE9] flex flex-col items-center text-center"> 
                <span className="text-xs font-semibold text-[#605E5C] uppercase tracking-wide mb-4">Calculated Risk Score</span>
                <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center ${riskColorBg} border-8 border-white shadow-sm mb-4 relative`}>
                   <span className={`text-6xl font-bold ${riskColorText} tracking-tighter`}>{riskScore}</span>
                   <span className={`text-sm font-semibold ${riskColorText}`}>%</span> 
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${riskBadgeColor}`}>
                  {isHighRisk ? 'Severe CKD' : (isMedRisk ? 'Moderate CKD' : 'Low Risk')}
                </div>
              </div>

              {/* Patient Details */}
              <div className="p-6 border-b border-[#EDEBE9]">
                <h3 className="text-sm font-semibold text-[#323130] mb-4">Demographics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#605E5C]">Age</span>
                    <span className="font-semibold text-[#323130]">{activePatient?.age || formData.Age || '--'} yrs</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#605E5C]">Biological Sex</span>
                    <span className="font-semibold text-[#323130]">
                      {activePatient?.sex === 1 || formData.Sex === '1' ? 'Male' : (activePatient?.sex === 0 || formData.Sex === '0' ? 'Female' : '--')}
                    </span>
                  </div>
                </div>
              </div>
              
             {/* Image Result Area (Now wired to PyTorch & Grad-CAM!) */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-[#323130] mb-4">Imaging Analysis</h3>
              
              {image ? (
                <>
                  {/* Container for the original image and overlay */}
                  <div className="w-full h-48 bg-[#161616] rounded flex items-center justify-center relative border border-[#EDEBE9] shadow-inner overflow-hidden group">
                    {/* The uploaded scan */}
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt="Patient Scan" 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    
                    {/* The PyTorch Results Overlay */}
                    {imageAnalysis ? (
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8 flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-300 uppercase tracking-widest mb-0.5">Model Detection</span>
                          <span className={`text-sm font-bold tracking-wide ${imageAnalysis.predicted_class === 'Normal' ? 'text-[#107C10]' : 'text-[#D13438]'}`}>
                            {imageAnalysis.finding}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-gray-300 uppercase tracking-widest mb-0.5">Confidence</span>
                          <span className="text-sm font-bold text-[#0078D4]">
                            {imageAnalysis.confidence}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Fallback while analyzing */
                      <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded p-2 flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#0078D4] rounded-full animate-ping"></span>
                        <span className="text-xs text-white font-medium">Analyzing...</span>
                      </div>
                    )}
                  </div>

                  {/* NEW: Grad-CAM Explainability Heatmap (Appears below original image) */}
                  {imageAnalysis?.heatmap_image && (
                    <div className="mt-4 border border-[#EDEBE9] rounded bg-white p-3 shadow-sm transition-all duration-500 ease-in-out">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#8E2DE2] animate-pulse"></span>
                          <p className="text-xs font-bold text-[#323130] uppercase tracking-widest">AI Focus Region</p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">Grad-CAM</span>
                      </div>
                      <img 
                        src={imageAnalysis.heatmap_image} 
                        alt="AI Heatmap Overlay" 
                        className="w-full h-48 rounded object-cover border border-slate-100 shadow-inner" 
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-32 bg-[#FAFAFA] border border-dashed border-[#C8C6C4] rounded flex flex-col items-center justify-center text-[#A19F9D]">
                  <svg className="w-6 h-6 mb-2 text-[#C8C6C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-[11px] font-medium text-[#605E5C]">No imaging data</span>
                </div>
              )}
            </div>
          </div>

            {/* RIGHT COLUMN: The Data Canvas */}
            <div className="flex-1 flex flex-col bg-white overflow-y-auto">
              <div className="p-10">
                
                {/* Main Vertical Layout for Panels */}
                <div className="flex flex-col gap-8 w-full">
                  
                  {/* Panel 0: LLM Clinical Interpretation */}
                  <div className="bg-gradient-to-r from-[#F4F9FF] to-[#FCFDFE] border border-[#D0E2F3] rounded-lg shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0078D4] via-[#8661C5] to-[#0078D4]"></div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#8661C5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <h2 className="text-base font-bold text-[#201F1E] tracking-tight">AI Clinical Interpretation</h2>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#8661C5] opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8661C5]"></span>
                           </span>
                           <span className="text-[10px] font-bold text-[#8661C5] uppercase tracking-wider">LLM Synthesis Active</span>
                        </div>
                      </div>

                      <div className="bg-white border border-[#EDEBE9] rounded p-4 text-sm text-[#323130] leading-relaxed">
                        {(() => {
                          const isSick = diceData && diceData.length > 0 && diceData[0].action && diceData[0].action.includes('TARGET');
                          const topDriver = shapData && shapData.length > 0 ? shapData[0].feature : "certain biomarkers";
                          const topTarget = diceData && diceData.length > 0 ? diceData[0].feature : "clinical markers";

                          return (
                            <>
                              <span className="font-semibold text-[#0078D4]">Executive Summary: </span>
                              Based on the predictive analysis, this patient is currently exhibiting a <span className="font-bold">{isSick ? 'High-Risk' : 'Low-Risk'} profile</span> for Chronic Kidney Disease. 
                              The primary driver behind this classification is the patient's <span className="font-semibold">{topDriver}</span> level. 
                              {isSick ? (
                                <span> To effectively mitigate this risk and transition the patient to a healthier profile, the most critical immediate intervention is the adjustment of <span className="font-semibold">{topTarget}</span>. Please review the DiCE pathways below for exact quantitative targets.</span>
                              ) : (
                                <span> The patient's current biomarkers are within acceptable thresholds. Maintaining current levels of {topDriver} is recommended to sustain this healthy profile.</span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div> 

                  {/* Middle Section: Grid for SHAP & KNN */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
                    
                    {/* Panel 1: SHAP Analysis */}
                    <div className="flex flex-col w-full bg-white rounded-md border border-[#EDEBE9] shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-6 border-b border-[#EDEBE9] pb-3">
                        <h2 className="text-lg font-semibold text-[#201F1E]">Feature Impact (SHAP)</h2>
                        <span className="px-2 py-0.5 bg-[#F3F2F1] text-[#605E5C] text-[10px] uppercase font-bold rounded tracking-wider">XAI</span>
                      </div>

                      <div className="w-full" style={{ height: '400px' }}>
                        {shapData && shapData.length > 0 ? (() => {
                          const formattedData = shapData.slice(0, 8).map(item => {
                            const val = Number(item.impact);
                            return {
                              feature: item.feature,
                              value: val,
                              displayValue: val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3),
                              fillColor: val > 0 ? '#D13438' : '#0078D4' 
                            };
                          });

                          return (
                            <ResponsiveContainer width="100%" height={400}>
                              <BarChart
                                data={formattedData}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EDEBE9" />
                                <XAxis type="number" tick={{ fill: '#605E5C', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="feature" type="category" tick={{ fill: '#323130', fontSize: 12, fontWeight: 600 }} width={110} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  cursor={{ fill: '#F3F2F1' }}
                                  contentStyle={{ borderRadius: '6px', border: '1px solid #EDEBE9' }}
                                  formatter={(value, name, props) => [props.payload.displayValue, 'Impact']}
                                />
                                <ReferenceLine x={0} stroke="#323130" strokeWidth={1.5} />
                                <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                                  {formattedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fillColor} />
                                  ))}
                                  <LabelList 
                                    dataKey="displayValue" 
                                    position="inside" 
                                    fill="#FFFFFF" 
                                    fontSize={11} 
                                    fontWeight="bold"
                                  />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          );
                        })() : (
                          <div className="flex h-full items-center justify-center border border-dashed border-[#C8C6C4] rounded bg-[#FAFAFA]">
                            <p className="text-sm text-[#A19F9D]">Processing SHAP values...</p>
                          </div>
                        )}
                      </div>
                    </div> 

                    {/* Panel 2: Cohort Matching */}
                    <div className="flex flex-col w-full h-fit bg-[#FAFAFA] rounded-md border border-[#EDEBE9] shadow-sm overflow-hidden">
                      {/* Sleek Header */}
                      <div className="flex flex-col px-6 py-5 border-b border-[#EDEBE9] bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <h2 className="text-lg font-semibold text-[#201F1E] tracking-tight">Matched Cohorts</h2>
                          <span className="px-2.5 py-0.5 bg-[#F3F2F1] text-[#605E5C] text-[10px] uppercase font-bold rounded tracking-widest border border-[#EDEBE9]">KNN</span>
                        </div>
                        <p className="text-xs text-[#605E5C]">Historical patients with highest clinical similarity.</p>
                      </div>

                      {/* Scrollable Data Area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {similarityData && similarityData.length > 0 ? (
                          similarityData.map((patient, index) => {
                            const isHighRiskPat = patient.Outcome && patient.Outcome.includes('High');
                            const badgeBg = isHighRiskPat ? 'bg-[#FDE7E9]' : 'bg-[#DFF6DD]';
                            const badgeText = isHighRiskPat ? 'text-[#A4262C]' : 'text-[#107C10]';
                            const badgeBorder = isHighRiskPat ? 'border-[#F1969B]' : 'border-[#9FD89F]';

                            return (
                              <div key={index} className="group relative bg-white border border-[#EDEBE9] rounded-md p-4 transition-all duration-200 hover:shadow-sm hover:border-[#C8C6C4]">
                                {/* Selection Indicator on Hover */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-[#0078D4] rounded-r transition-all duration-200 group-hover:h-8"></div>

                                <div className="flex items-center justify-between ml-2">
                                  {/* Left: Neutral Avatar & Main Info */}
                                  <div className="flex items-center gap-4 flex-shrink-0 w-32">
                                    <div className="h-9 w-9 rounded flex items-center justify-center flex-shrink-0 bg-[#F3F2F1] border border-[#EDEBE9]">
                                      <svg className="w-4 h-4 text-[#605E5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-[#A19F9D] uppercase tracking-wider mb-0.5">Match {index + 1}</span>
                                      <span className="text-sm font-semibold text-[#323130] whitespace-nowrap">Age {patient.Age || '--'}</span>
                                    </div>
                                  </div>

                                  {/* Middle: Flex Data Row */}
                                  <div className="hidden sm:flex flex-1 items-center justify-evenly px-4 border-l border-[#EDEBE9] mx-2 gap-4">
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] text-[#605E5C] mb-0.5">GFR</span>
                                      <span className="text-xs font-semibold text-[#323130]">{patient.GFR || '--'}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] text-[#605E5C] mb-0.5">Creatinine</span>
                                      <span className="text-xs font-semibold text-[#323130]">{patient.Creatinine || '--'}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] text-[#605E5C] mb-0.5">Urea</span>
                                      <span className="text-xs font-semibold text-[#323130]">{patient.Urea || '--'}</span>
                                    </div>
                                  </div>

                                  {/* Right: Subtle Outcome Badge */}
                                  <div className="flex justify-end flex-shrink-0 w-24">
                                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${badgeBorder} ${badgeBg} ${badgeText}`}>
                                      {patient.Outcome || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center h-40 text-center">
                             <svg className="w-8 h-8 text-[#C8C6C4] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            <p className="text-sm font-medium text-[#605E5C]">Searching records...</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div> {/* End of Middle Grid */}

                  {/* Panel 3: DiCE Counterfactuals */}
                  <div className="w-full border-t border-[#EDEBE9] pt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-[#201F1E]">Clinical Biomarker Targets</h2>
                        <span className="px-2 py-0.5 bg-[#F3F2F1] text-[#605E5C] text-[10px] uppercase font-bold rounded tracking-wider border border-[#EDEBE9]">DiCE</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-[#DFF6DD] border border-[#9FD89F] px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#107C10] animate-pulse"></span>
                        <span className="text-xs font-bold text-[#107C10] uppercase tracking-wider">Actionable Insights</span>
                      </div>
                    </div>
                    {diceData && diceData.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {diceData.map((item, index) => {
                          const isDanger = item.action && item.action.includes('🚨');
                          const topBar = isDanger ? 'bg-[#D13438]' : 'bg-[#0078D4]';
                          const iconBg = isDanger ? 'bg-[#FDE7E9]' : 'bg-[#EBF3FC]';
                          const iconColor = isDanger ? 'text-[#D13438]' : 'text-[#0078D4]';
                          const badgeBg = isDanger ? 'bg-[#FDE7E9]' : 'bg-[#DFF6DD]';
                          const badgeText = isDanger ? 'text-[#D13438]' : 'text-[#107C10]';
                          const badgeLabel = isDanger ? 'Danger Risk' : 'Target Goal';
                          const actionText = item.action || '';
                          const moveText = actionText.includes('Increase') ? 'Increase' : actionText.includes('Decrease') ? 'Decrease' : 'Change';
                          return (
                            <div key={index} className="group flex flex-col bg-white border border-[#EDEBE9] rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
                              <div className={`absolute top-0 left-0 w-full h-1 ${topBar}`}></div>
                              <div className="px-5 py-4 border-b border-[#F3F2F1] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`h-8 w-8 rounded-full ${iconBg} ${iconColor} flex items-center justify-center`}>
                                    {isDanger ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="2" /><circle cx="12" cy="12" r="4" strokeWidth="2" /></svg>}
                                  </div>
                                  <h4 className="text-base font-bold text-[#201F1E] tracking-tight">{item.feature}</h4>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeBg} ${badgeText}`}>{badgeLabel}</span>
                              </div>
                              <div className="p-5 bg-[#FAFAFA] flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex flex-col items-start w-1/3"><span className="text-[10px] text-[#605E5C] uppercase tracking-wider mb-1 font-bold">Current</span><span className="text-xl font-bold text-[#323130]">{item.current}</span></div>
                                  <div className="flex flex-col items-center w-1/3"><span className={`text-[9px] font-bold mb-1 ${iconColor} uppercase tracking-widest`}>{moveText}</span><div className="flex items-center w-full"><div className={`h-px flex-1 ${isDanger ? 'bg-[#D13438]' : 'bg-[#0078D4]'}`}></div><svg className={`w-4 h-4 ${iconColor} mx-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg><div className={`h-px flex-1 ${isDanger ? 'bg-[#D13438]' : 'bg-[#0078D4]'}`}></div></div></div>
                                  <div className="flex flex-col items-end w-1/3"><span className="text-[10px] text-[#605E5C] uppercase tracking-wider mb-1 font-bold">Target</span><span className={`text-xl font-bold ${iconColor}`}>{item.target}</span></div>
                                </div>
                                <p className="text-[11px] text-[#605E5C] text-center border-t border-[#EDEBE9] pt-3 mt-2 font-medium">{actionText.replace('✅ ', '').replace('🚨 ', '')}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="w-full border border-dashed border-[#C8C6C4] bg-[#FAFAFA] rounded-md p-10 flex flex-col items-center justify-center text-center"><svg className="w-10 h-10 text-[#C8C6C4] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg><p className="text-sm font-medium text-[#323130]">No intervention targets generated yet.</p></div>
                    )}
                  </div>

              </div> {/* End of Main Vertical Layout */}
              </div>
            </div>

          </div>
        </div>

        {/* --- CHATBOT SAFELY PLACED INSIDE THE MAIN WRAPPER --- */}
        <Chatbot patientContext={
          hasResults ? `
            Risk Score: ${riskScore}%. 
            DiCE Targets: ${JSON.stringify(diceData)}.
            SHAP Top Drivers: ${JSON.stringify(shapData ? shapData.slice(0,3) : [])}
          ` : 'No diagnostic data run yet.'
        } />

      </div>
    );
  }

  // ==========================================
  // VIEW 1: THE PREMIUM INPUT FORM
  // ==========================================
  // Reusable Input Style for perfect consistency
  const inputStyle = "mt-1 block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-slate-50/50 transition-all outline-none";
  const labelStyle = "block text-xs font-semibold leading-6 text-slate-700 tracking-wide uppercase";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* Premium Navbar */}
      <nav className="bg-white px-8 py-4 flex justify-between items-center border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-inner">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nephro<span className="font-light">AI</span></h1>
        </div>
        <button onClick={() => navigate('/home')} className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Sign Out</button>
      </nav>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto p-6 mt-6 mb-12">
        
        {/* ========================================== */}
        {/* THE NEW PATIENT BANNER (Safe Guardrail)    */}
        {/* ========================================== */}
        {activePatient ? (
          <div className="mb-6 bg-[#1C2541] rounded-2xl p-6 border border-[#3A506B] shadow-md flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D2FF] to-[#0078D4] flex items-center justify-center font-bold text-lg shadow-inner">
                {activePatient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{activePatient.name}</h2>
                <div className="flex items-center gap-3 text-sm text-[#A0AABF] mt-1 font-mono">
                  <span>MRN: <span className="text-white font-semibold">{activePatient.mrn}</span></span>
                  <span>•</span>
                  <span>Age: <span className="text-white font-semibold">{activePatient.age}</span></span>
                  <span>•</span>
                  <span>Sex: <span className="text-white font-semibold">{activePatient.sex === 1 ? 'Male' : 'Female'}</span></span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 bg-[#0B132B] rounded-xl border border-[#3A506B] text-sm font-bold text-[#00D2FF] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D2FF] animate-pulse"></span>
              Ready for Analysis
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">No Patient Selected</h2>
            <p className="text-slate-500 mb-4">Please select a patient from the Command Center before running diagnostics.</p>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Return to Search
            </button>
          </div>
        )}
        {/* ========================================== */}


        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          
          {/* Header Area */}
          <div className="px-10 pt-10 pb-6 border-b border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Data Entry</h2>
            <p className="text-slate-500 mt-1 text-sm">Enter the patient's 21-feature blood panel and optional diagnostic imaging.</p>
          </div>
          
          {/* Disable the form if no patient is selected */}
          <form onSubmit={handleDiagnose} className={`px-10 py-8 space-y-10 ${!activePatient && 'opacity-50 pointer-events-none'}`}>
            
            {/* SECTION 1: Demographics & Renal */}
            {/* SECTION 1: Demographics & Renal */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 border-l-4 border-blue-600 pl-3 mb-6">Demographics & Renal Panel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className={labelStyle}>Age</label>
                  {/* Notice the new value={formData.Age} ! */}
                  <input type="number" name="Age" value={formData.Age} onChange={handleChange} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Sex</label>
                  <select name="Sex" value={formData.Sex} onChange={handleChange} className={inputStyle} required>
                    <option value="">Select...</option>
                    <option value="1">Male (1)</option>
                    <option value="0">Female (0)</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Creatinine</label>
                  <input type="number" step="0.1" name="Creatinine" value={formData.Creatinine} onChange={handleChange} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>GFR</label>
                  <input type="number" step="0.1" name="GFR" value={formData.GFR} onChange={handleChange} className={inputStyle} required />
                </div>
                <div className="md:col-span-2">
                  <label className={labelStyle}>Urea</label>
                  <input type="number" step="0.1" name="Urea" value={formData.Urea} onChange={handleChange} className={inputStyle} required />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

           {/* SECTION 2: Standard CBC */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 border-l-4 border-teal-500 pl-3 mb-6">Complete Blood Count (CBC)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                {['Haemoglobin', 'Hematocrit', 'RBCCount', 'WBCCount', 'PlateletCount', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Polymorphs'].map((field) => (
                  <div key={field}>
                    <label className={labelStyle}>{field}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name={field} 
                      value={formData[field] === null || formData[field] === undefined ? '' : formData[field]} 
                      onChange={handleChange} 
                      className={inputStyle} 
                      required 
                    />
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SECTION 3: Blood Indices */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 border-l-4 border-purple-500 pl-3 mb-6">Advanced Indices</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
                {['MCV', 'MCH', 'MCHC', 'RDWSD', 'MPV', 'PCT', 'PDW'].map((field) => (
                  <div key={field}>
                    <label className={labelStyle}>{field}</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name={field} 
                      value={formData[field] === null || formData[field] === undefined ? '' : formData[field]} 
                      onChange={handleChange} 
                      className={inputStyle} 
                      required 
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* SECTION 4: Image Upload */}
            <div>
              <h3 className="text-base font-semibold text-slate-900 border-l-4 border-slate-400 pl-3 mb-6">Diagnostic Imaging (Optional)</h3>
              <div className="mt-2 flex justify-center rounded-xl border border-dashed border-slate-300 px-6 py-10 hover:bg-slate-50 hover:border-blue-500 transition-all bg-white">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-slate-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                  </svg>
                  <div className="mt-4 flex justify-center text-sm leading-6 text-slate-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none hover:text-blue-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-slate-500 mt-1">{image ? image.name : "Ultrasound or CT Scan up to 10MB"}</p>
                </div>
              </div>
            </div>

            {/* Premium Submit Button */}
            <div className="pt-4 pb-2">
              <button type="submit" disabled={isProcessing} className="w-full py-3.5 rounded-xl text-white font-semibold text-lg bg-slate-900 hover:bg-slate-800 shadow-md transition-all disabled:bg-slate-300 disabled:cursor-not-allowed">
                {isProcessing ? 'Analyzing Clinical Data...' : 'Run Diagnostics & View Results'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}