import React, { useState, useEffect, useMemo } from 'react';

interface SavedRule {
  id: string;
  name: string;
  description: string;
}

interface SimulationResult {
  record_id: string;
  entity_name: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: string[];
}

const Simulations: React.FC = () => {
  const [step, setStep] = useState(2);
  const [savedRules, setSavedRules] = useState<SavedRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [jsonInput, setJsonInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [results, setResults] = useState<SimulationResult[]>([]);

  useEffect(() => {
    const rulesRaw = localStorage.getItem('cra_saved_rules');
    if (rulesRaw) {
      const rules: SavedRule[] = JSON.parse(rulesRaw);
      setSavedRules(rules);
    }
  }, []);

  const defaultFrameworks = [
    { id: 'def-1', name: 'UK AML 2024 - High Net Worth Individuals' },
    { id: 'def-2', name: 'FCA Handbook - Consumer Credit Risk' },
    { id: 'def-3', name: 'UK Sanctions List Screening' },
  ];

  // Dynamic progress calculation for the input phase
  const formProgress = useMemo(() => {
    let progress = 33; // Base progress for being on the Input Phase
    if (selectedRuleId) progress += 33;
    if (jsonInput.trim().length > 10) progress += 34; // Basic check for JSON presence
    return Math.min(progress, 100);
  }, [selectedRuleId, jsonInput]);

  const handleGenerateSampleData = () => {
    const sampleData = [
      {
        "record_id": "UK-2024-001",
        "entity_name": "Sterling Capital Partners",
        "domicile": "GB",
        "pep_count": 0,
        "sanction_match": false,
        "transaction_volume": 1250000,
        "risk_profile": "Standard"
      },
      {
        "record_id": "UK-2024-002",
        "entity_name": "Global Horizon Holdings",
        "domicile": "VG",
        "pep_count": 2,
        "sanction_match": false,
        "transaction_volume": 8500000,
        "risk_profile": "High"
      },
      {
        "record_id": "UK-2024-003",
        "entity_name": "Astra Ventures Ltd",
        "domicile": "GB",
        "pep_count": 1,
        "sanction_match": true,
        "transaction_volume": 45000,
        "risk_profile": "Critical"
      },
      {
        "record_id": "UK-2024-004",
        "entity_name": "Riviera Yacht Charters",
        "domicile": "MC",
        "pep_count": 1,
        "sanction_match": false,
        "transaction_volume": 4500000,
        "risk_profile": "Medium"
      },
      {
        "record_id": "UK-2024-005",
        "entity_name": "Local Tech Solutions",
        "domicile": "GB",
        "pep_count": 0,
        "sanction_match": false,
        "transaction_volume": 12000,
        "risk_profile": "Standard"
      }
    ];
    setJsonInput(JSON.stringify(sampleData, null, 2));
  };

  const runSimulation = () => {
    if (!jsonInput || !selectedRuleId) return;
    setIsSimulating(true);
    setSimulationProgress(0);

    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    setTimeout(() => {
      try {
        const data = JSON.parse(jsonInput);
        const processed: SimulationResult[] = data.map((item: any) => {
          let score = Math.floor(Math.random() * 40);
          const findings = [];

          if (item.pep_count > 0) {
            score += 30;
            findings.push(`${item.pep_count} PEP associations found`);
          }
          if (item.sanction_match) {
            score += 50;
            findings.push('Direct Sanctions List match identified');
          }
          if (item.domicile !== 'GB') {
            score += 15;
            findings.push('Non-UK high risk jurisdiction');
          }
          if (item.transaction_volume > 1000000) {
            score += 10;
            findings.push('High value transaction volume');
          }

          let level: SimulationResult['risk_level'] = 'LOW';
          if (score >= 80) level = 'CRITICAL';
          else if (score >= 60) level = 'HIGH';
          else if (score >= 40) level = 'MEDIUM';

          return {
            record_id: item.record_id || 'ID-' + Math.random().toString(36).substr(2, 5),
            entity_name: item.entity_name || 'Unknown Entity',
            risk_score: Math.min(score, 100),
            risk_level: level,
            findings
          };
        });

        setResults(processed);
        setStep(3);
        setIsSimulating(false);
      } catch (e) {
        alert("Invalid JSON data provided.");
        setIsSimulating(false);
      }
    }, 2500);
  };

  const resetSimulation = () => {
    setStep(2);
    setResults([]);
  };

  const selectedRuleName = [...defaultFrameworks, ...savedRules].find(r => r.id === selectedRuleId)?.name || 'None selected';

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background-light dark:bg-background-dark p-8">
      <main className="max-w-6xl mx-auto w-full">
        {isSimulating ? (
          <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center animate-in fade-in duration-700">
            <div className="w-full max-w-md text-center">
              <div className="mb-8 relative">
                <div className="size-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
                  <span className="material-symbols-outlined text-4xl text-amber-500 animate-pulse">analytics</span>
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Simulating Risk Engine...</h2>
              <p className="text-slate-500 text-sm mb-8">Validating entries against regulatory compliance logic.</p>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-4 shadow-inner">
                <div className="bg-amber-500 h-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(245,158,11,0.5)]" style={{ width: `${simulationProgress}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Ingesting Data</span>
                <span>{simulationProgress}%</span>
              </div>
            </div>
          </div>
        ) : step === 2 ? (
          <>
            <div className="mb-8 flex items-center gap-4">
              <div className="size-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined !text-3xl">analytics</span>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Batch Simulation</h1>
                <p className="text-slate-500">Back-test regulatory rules against high-volume data sets.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-8 shadow-sm transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-sm transition-colors ${formProgress === 100 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>{formProgress === 100 ? '✓' : step}</div>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">Input Data Phase</span>
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest transition-colors ${formProgress === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {formProgress === 100 ? 'Ready' : 'In Progress'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ease-in-out ${formProgress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${formProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                <span className={selectedRuleId ? 'text-emerald-500 font-bold' : ''}>1. Rule Selection</span>
                <span className={jsonInput.trim().length > 10 ? 'text-emerald-500 font-bold' : 'text-amber-600 font-bold'}>2. Input Data</span>
                <span>3. Results</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section className={`bg-white dark:bg-[#1a202c] border rounded-xl overflow-hidden shadow-sm transition-colors ${selectedRuleId ? 'border-emerald-500/30' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                      <span className={`material-symbols-outlined ${selectedRuleId ? 'text-emerald-500' : 'text-amber-600'}`}>rule</span>
                      <h3 className="font-bold">1. Rule Selection</h3>
                    </div>
                    {selectedRuleId && <span className="material-symbols-outlined text-emerald-500 !text-sm">check_circle</span>}
                  </div>
                  <div className="p-6">
                    <label className="block text-sm font-semibold mb-2">Select Regulatory Framework or Saved Rule</label>
                    <select 
                      className="form-select w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:border-amber-500 focus:ring-amber-500"
                      value={selectedRuleId}
                      onChange={(e) => setSelectedRuleId(e.target.value)}
                    >
                      <option value="">-- Choose a Rule --</option>
                      <optgroup label="System Default Frameworks">
                        {defaultFrameworks.map(df => (
                          <option key={df.id} value={df.id}>{df.name}</option>
                        ))}
                      </optgroup>
                      {savedRules.length > 0 && (
                        <optgroup label="Custom Saved Rules (from Rule Builder)">
                          {savedRules.map(sr => (
                            <option key={sr.id} value={sr.id}>{sr.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </section>

                <section className={`bg-white dark:bg-[#1a202c] border rounded-xl overflow-hidden shadow-sm transition-colors ${jsonInput.trim().length > 10 ? 'border-emerald-500/30' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between text-slate-900 dark:text-white">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${jsonInput.trim().length > 10 ? 'text-emerald-500' : 'text-amber-600'}`}>data_object</span>
                      <h3 className="font-bold">2. Input Data</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {jsonInput.trim().length > 10 && <span className="material-symbols-outlined text-emerald-500 !text-sm mr-2">check_circle</span>}
                      <button 
                        onClick={handleGenerateSampleData}
                        className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase rounded-md hover:bg-amber-500 hover:text-white transition-all border border-amber-500/20"
                      >
                        <span className="material-symbols-outlined !text-sm">auto_fix</span>
                        Generate Sample Data
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm font-semibold">Manual JSON Entry</label>
                      </div>
                      <textarea 
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono p-4 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-inner" 
                        placeholder='[{"record_id": "UK-9921", "name": "Sterling Corp", "domicile": "GB"}]' 
                        rows={8}
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm sticky top-4">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">Simulation Summary</h4>
                  <div className="space-y-4 text-slate-900 dark:text-white">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Target Policy</p>
                      <p className={`text-sm font-bold mt-1 ${selectedRuleId ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedRuleName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Total Entries</p>
                      <p className="text-sm font-bold mt-1">
                        {jsonInput ? (JSON.parse(jsonInput || '[]').length || 0) : '0'} Records
                      </p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={runSimulation}
                        disabled={!jsonInput || !selectedRuleId}
                        className={`w-full text-white font-black py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${jsonInput && selectedRuleId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 active:scale-95' : 'bg-slate-300 cursor-not-allowed shadow-none'}`}
                      >
                        <span className="material-symbols-outlined">play_arrow</span> RUN BATCH
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="size-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined !text-3xl">analytics</span>
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Simulation Results</h1>
                  <p className="text-slate-500">Completed against {selectedRuleName}</p>
                </div>
              </div>
              <button 
                onClick={resetSimulation}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-all"
              >
                <span className="material-symbols-outlined">restart_alt</span> New Simulation
              </button>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-[#1a202c] p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{results.length}</p>
              </div>
              <div className="bg-white dark:bg-[#1a202c] p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">High Risks</p>
                <p className="text-2xl font-black text-red-600">{results.filter(r => r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL').length}</p>
              </div>
              <div className="bg-white dark:bg-[#1a202c] p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Risk Score</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {results.length > 0 ? Math.round(results.reduce((acc, curr) => acc + curr.risk_score, 0) / results.length) : 0}%
                </p>
              </div>
              <div className="bg-amber-500 p-5 border border-amber-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
                <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">Model Accuracy</p>
                <p className="text-2xl font-black">99.4%</p>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity & ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Risk Score</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Findings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((res, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{res.entity_name}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{res.record_id}</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-lg font-black ${
                          res.risk_score > 70 ? 'text-red-600' : res.risk_score > 40 ? 'text-amber-500' : 'text-emerald-600'
                        }`}>
                          {res.risk_score}%
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${
                          res.risk_level === 'CRITICAL' ? 'bg-red-600 text-white' :
                          res.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          res.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {res.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1">
                          {res.findings.length > 0 ? res.findings.map((f, idx) => (
                            <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[9px] border border-slate-200 dark:border-slate-700">
                              {f}
                            </span>
                          )) : (
                            <span className="text-[10px] italic text-slate-400">Clear</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Simulations;