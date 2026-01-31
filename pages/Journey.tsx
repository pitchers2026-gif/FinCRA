
import React from 'react';
import { Link } from 'react-router-dom';

const Journey: React.FC = () => {
  const steps = [
    { 
      title: 'Data Sources', 
      sub: 'Ingestion', 
      path: '/reference', 
      icon: 'database', 
      color: 'bg-slate-500', 
      textColor: 'text-slate-600'
    },
    { 
      title: 'Rule Builder', 
      sub: 'Logic', 
      path: '/rules', 
      icon: 'schema', 
      color: 'bg-primary', 
      textColor: 'text-primary'
    },
    { 
      title: 'Simulation', 
      sub: 'Testing', 
      path: '/simulations', 
      icon: 'analytics', 
      color: 'bg-amber-500', 
      textColor: 'text-amber-600'
    },
    { 
      title: 'Governance', 
      sub: 'Reporting', 
      path: '/governance', 
      icon: 'policy', 
      color: 'bg-emerald-500', 
      textColor: 'text-emerald-600'
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto canvas-grid bg-slate-50/30">
      <section className="w-full py-12 px-6">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Compliance Journey</h1>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">Select a module to manage your regulatory lifecycle.</p>
          </div>

          <div className="grid grid-cols-4 gap-4 relative">
            {/* Connecting line */}
            <div className="absolute top-[40px] left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>
            
            {steps.map((step, idx) => (
              <Link 
                key={idx} 
                to={step.path}
                className="group flex flex-col items-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`size-12 rounded-xl ${step.color} text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined !text-xl">{step.icon}</span>
                </div>
                <div className="text-center">
                  <h3 className={`text-[11px] font-black uppercase tracking-tight ${step.textColor}`}>
                    {step.title}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-medium hidden sm:block">{step.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="max-w-[1000px] mx-auto bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="material-symbols-outlined !text-[150px]">verified</span>
          </div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 inline-block">System Status: Active</span>
              <h2 className="text-2xl font-black mb-3">Unified Risk Oversight</h2>
              <p className="text-slate-400 leading-relaxed mb-6 text-sm">
                The CRA Platform provides a single source of truth for your firm's regulatory compliance posture. 
                Configure once, simulate everywhere, and report with confidence.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="material-symbols-outlined text-primary !text-sm">security</span>
                  <span className="text-[10px] font-bold">FCA Compliant</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="material-symbols-outlined text-amber-500 !text-sm">bolt</span>
                  <span className="text-[10px] font-bold">Real-time Analysis</span>
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10 backdrop-blur-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Recent Platform Activity</h4>
              <div className="space-y-3">
                {[
                  { icon: 'schema', text: 'New Rule: "Hedge Fund Sanctions" Deployed', time: '2m ago' },
                  { icon: 'analytics', text: 'Simulation: "Q2 Stress Test" Completed', time: '1h ago' },
                  { icon: 'database', text: 'Schema Update: KYB Fields V2.4', time: '4h ago' }
                ].map((act, i) => (
                  <div key={i} className="flex items-center gap-3 text-[10px]">
                    <span className="material-symbols-outlined text-slate-400 !text-sm">{act.icon}</span>
                    <span className="flex-1 text-slate-300 truncate">{act.text}</span>
                    <span className="text-slate-500 font-mono whitespace-nowrap">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Copyright Section */}
      <footer className="mt-auto py-8 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c]">
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
               <div className="size-6 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined !text-[14px]">account_tree</span>
              </div>
              <span className="text-sm font-black tracking-tighter text-slate-900 dark:text-white">FinCRA PLATFORM</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} FinCRA Platform. A product of Regulatory Labs UK. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Platform Version</span>
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">v2.4.1-stable</span>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
            <nav className="flex items-center gap-4">
              <a href="#" className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">Security</a>
              <a href="#" className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">Privacy</a>
              <a href="#" className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">Terms</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Journey;
