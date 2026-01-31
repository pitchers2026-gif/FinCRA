
import React from 'react';

const Governance: React.FC = () => {
  const reports = [
    { id: 'REP-001', name: 'Annual MLR Compliance Report 2024', type: 'FCA Annex 1', status: 'Submitted', date: '2024-03-15', author: 'John Doe' },
    { id: 'REP-002', name: 'Q1 High Risk Jurisdiction Review', type: 'Internal Audit', status: 'Pending Approval', date: '2024-04-01', author: 'Sarah Smith' },
    { id: 'REP-003', name: 'Ad-hoc Sanctions Matching Audit', type: 'Regulatory Inquiry', status: 'Draft', date: '2024-04-05', author: 'John Doe' },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-background-dark overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-10 flex items-center gap-4">
          <div className="size-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined !text-3xl">policy</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Governance</h1>
            <p className="text-slate-500 mt-1 text-lg">Regulatory reporting and compliance oversight.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Reports Submitted', val: '24', icon: 'description', color: 'text-emerald-500' },
            { label: 'Pending Reviews', val: '03', icon: 'pending_actions', color: 'text-amber-500' },
            { label: 'System Compliance', val: '98.2%', icon: 'verified_user', color: 'text-emerald-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-[#1a202c] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
              <div className={`size-12 rounded-lg bg-emerald-50 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.val}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm mb-12">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="font-bold text-lg">Regulatory Submissions</h2>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors">
              <span className="material-symbols-outlined !text-lg">add</span> New Report
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{rep.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{rep.id}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">{rep.type}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      rep.status === 'Submitted' ? 'bg-emerald-100 text-emerald-700' :
                      rep.status === 'Draft' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {rep.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{rep.date}</td>
                  <td className="px-6 py-4">
                    <button className="text-emerald-600 hover:underline text-xs font-bold">Download PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-slate-900 rounded-xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined !text-[120px]">policy</span>
          </div>
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-2xl font-black mb-4 tracking-tight">Governance Enforcement</h3>
            <p className="text-slate-400 mb-6 leading-relaxed">
              All rules deployed on the CRA Platform are automatically timestamped and versioned for full audit reproducibility. 
              The system maintains a tamper-proof log of every risk assessment performed.
            </p>
            <div className="flex gap-4">
              <button className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-black text-sm hover:bg-emerald-600 transition-colors">View Audit Trail</button>
              <button className="bg-slate-800 text-white px-6 py-3 rounded-lg font-black text-sm hover:bg-slate-700 transition-colors">Export Logs</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Governance;
