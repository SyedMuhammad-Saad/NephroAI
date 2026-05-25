import React from 'react';

export default function ResultsVisualizer({ riskScore, shapData, diceData, similarityData }) {
  
  // 1. Sleek Status Logic
  let statusText = 'Low Risk';
  let statusColor = 'text-emerald-600';
  let badgeBg = 'bg-emerald-50';
  let borderColor = 'border-emerald-200';

  if (riskScore >= 75) {
    statusText = 'High Risk (Severe)';
    statusColor = 'text-rose-600';
    badgeBg = 'bg-rose-50';
    borderColor = 'border-rose-200';
  } else if (riskScore >= 50) {
    statusText = 'Moderate Risk';
    statusColor = 'text-amber-600';
    badgeBg = 'bg-amber-50';
    borderColor = 'border-amber-200';
  }

  // 2. SHAP Math
  const maxShapValue = shapData && shapData.length > 0 
    ? Math.max(...shapData.map(d => Math.abs(d.value))) 
    : 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 tracking-tight">AI Diagnostic Report</h2>
        <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
          Generated via Random Forest & DiCE
        </span>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto">
        
        {/* --- MODULE 1: CLINICAL SUMMARY --- */}
        <div className={`p-5 rounded-xl border ${borderColor} ${badgeBg} flex items-center justify-between`}>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Overall Assessment</h3>
            <div className={`text-2xl font-bold ${statusColor}`}>{statusText}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Calculated Risk Score</div>
            <div className={`text-4xl font-extrabold ${statusColor}`}>{riskScore}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* --- MODULE 2: SHAP ANALYSIS (Sleek Bars) --- */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Key Decision Drivers
            </h4>
            <div className="space-y-4">
              {shapData ? shapData.slice(0, 5).map((item, index) => {
                const widthPercent = (Math.abs(item.value) / maxShapValue) * 100;
                const isRiskIncreasing = item.value > 0;
                return (
                  <div key={index} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-gray-600 font-medium">
                      <span>{item.feature}</span>
                      <span className={isRiskIncreasing ? 'text-rose-500' : 'text-emerald-500'}>
                        {isRiskIncreasing ? '↑ Increases Risk' : '↓ Decreases Risk'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isRiskIncreasing ? 'bg-rose-400' : 'bg-emerald-400'}`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-gray-400 italic">Processing feature importance...</p>}
            </div>
          </div>

          {/* --- MODULE 3: PATIENT COHORT (Clean List) --- */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Clinical Cohort Matches
            </h4>
            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
              {similarityData ? similarityData.map((patient, index) => (
                <div key={index} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="text-xs font-semibold text-gray-800">Match {index + 1} • Age {patient.Age}</div>
                    <div className="text-xs text-gray-500 mt-0.5">GFR: {patient.GFR} | Creatinine: {patient.Creatinine}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${patient.Outcome.includes('High Risk') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {patient.Outcome.includes('High Risk') ? 'CKD Positive' : 'CKD Negative'}
                  </span>
                </div>
              )) : <p className="text-sm text-gray-400 italic">Querying database...</p>}
            </div>
          </div>

        </div>

        {/* --- MODULE 4: DiCE RECOMMENDATIONS (Clinical Table) --- */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            Target Counterfactuals (Intervention Plan)
          </h4>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            {diceData && diceData.length > 0 ? (
              <div className="space-y-4">
                {diceData.map((rec, index) => {
                  if (typeof rec === 'string') {
                    const parts = rec.split(':');
                    return (
                      <div key={index} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{parts.length > 1 ? <><span className="font-semibold">{parts[0]}:</span> {parts.slice(1).join(':')}</> : rec}</span>
                      </div>
                    );
                  } else if (typeof rec === 'object') {
                    // Render objects as a clean grid instead of messy tags
                    return (
                      <div key={index} className="bg-white p-4 rounded border border-gray-200">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-2">Target Profile {index + 1}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(rec).slice(0, 8).map(([key, value]) => ( // Limit to 8 to avoid clutter
                            <div key={key} className="flex flex-col">
                              <span className="text-xs text-gray-500 truncate">{key}</span>
                              <span className="text-sm font-semibold text-gray-800">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No counterfactual interventions generated for this profile.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}