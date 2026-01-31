
import React, { useState, useRef } from 'react';

const DataReference: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const mainContentRef = useRef<HTMLDivElement>(null);

  const fields = [
    { name: 'registration_number', type: 'String', source: 'Companies House', desc: 'Official 8-digit unique company registration number (CRN).' },
    { name: 'sic_codes', type: 'Array<Int>', source: 'Companies House', desc: 'Standard Industrial Classification of economic activities codes.' },
    { name: 'incorporation_date', type: 'Date', source: 'Companies House', desc: 'The date the entity was officially registered and established.' },
    { name: 'is_active', type: 'Boolean', source: 'External Bureau', desc: 'Status flag indicating if company is currently trading.' },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element && mainContentRef.current) {
      // Direct scroll on the parent container
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { id: 'intro', label: 'Introduction', icon: 'description' },
    { id: 'kyb', label: 'Entity (KYB) Fields', icon: 'business' },
    { id: 'parties', label: 'Key Party Fields', icon: 'group' },
    { id: 'schema', label: 'CRA Record Schema', icon: 'data_object' },
    { id: 'payload', label: 'Sample Payload', icon: 'terminal' },
  ];

  return (
    <div className="flex h-full max-w-[1440px] mx-auto gap-6 px-6 py-8 overflow-hidden">
      <aside className="hidden lg:block w-64 shrink-0 h-full overflow-y-auto pr-2">
        <div className="flex flex-col gap-8 sticky top-0">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Documentation</h3>
            <div className="space-y-1">
              {navItems.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => scrollToSection(item.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeSection === item.id ? 'bg-slate-100 text-slate-900 border-l-4 border-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 border-l-4 border-transparent'}`}
                >
                  <span className="material-symbols-outlined !text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main ref={mainContentRef} className="flex-1 min-w-0 overflow-y-auto pr-4 scroll-smooth pb-20">
        <div id="intro" className="mb-12 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
               <div className="size-14 bg-slate-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined !text-3xl">database</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Data Sources</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Detailed schema documentation for modeling.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-sm"><span className="material-symbols-outlined !text-lg">download</span>Download JSON</button>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg max-w-3xl">
            The FinCRA Data Source reference defines the structure and source of truth for all ingestion pipelines. 
            All batch simulations and rule evaluations depend on the fields defined within this unified schema.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-10 shadow-sm sticky top-0 z-10 backdrop-blur-md">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <span className="material-symbols-outlined">filter_list</span>
            </span>
            <input className="form-input block w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-12 pr-4 py-3 text-base" placeholder="Filter fields by name, type, or description..." />
          </div>
        </div>

        <section className="mb-20 scroll-mt-32" id="kyb">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><span className="material-symbols-outlined">business</span></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Entity (KYB) Fields</h2>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {['Field Name', 'Type', 'Source', 'Description'].map(h => (
                      <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {fields.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-medium text-slate-700 dark:text-slate-200">{f.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-tight">{f.type}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{f.source}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mb-20 scroll-mt-32" id="parties">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><span className="material-symbols-outlined">group</span></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Key Party Fields</h2>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
             <p className="text-slate-500 italic">Documentation for Individual stakeholders, PSCs, and Officers... (Coming soon)</p>
          </div>
        </section>

        <section className="mb-20 scroll-mt-32" id="schema">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><span className="material-symbols-outlined">data_object</span></div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">CRA Record Schema</h2>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
             <p className="text-slate-500 italic">Detailed mapping of internal risk score weights and historical data structures...</p>
          </div>
        </section>

        <section className="mb-12 scroll-mt-32" id="payload">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-slate-100"><span className="material-symbols-outlined">code</span></div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sample Payload</h2>
            </div>
          </div>
          <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
              <span className="ml-4 text-xs font-mono text-slate-500">cra_payload_v1.0.json</span>
            </div>
            <pre className="p-6 overflow-x-auto font-mono text-sm leading-relaxed text-slate-300 code-scrollbar">
              <code>{`{
  "entity": {
    "id": "UK-8921-X",
    "name": "Acme Global UK Ltd",
    "registration_number": "08234123",
    "incorporation_date": "2012-05-14T00:00:00Z",
    "sic_codes": [6201, 6202]
  },
  "key_parties": [
    {
      "party_name": "Jane Doe",
      "role": "Director",
      "ownership_pct": 51.0,
      "pep_status": false
    }
  ],
  "risk_context": {
    "jurisdiction": "GB",
    "risk_rating": 740
  }
}`}</code>
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DataReference;
