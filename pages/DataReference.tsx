
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
          <p className="text-slate-600 dark:text-slate-400 mb-4">Input fields used by the CRA engine for component scores and override rules. Geography, Industry, Entity, Product, and Delivery feed the weighted pre-override score; sanction/PEP flags trigger overrides.</p>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    {['Field', 'Type', 'Pillar', 'Description'].map(h => (
                      <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {[
                    { field: 'country_code', type: 'String (ISO)', pillar: 'Geography', desc: 'ISO country code for geography scorecard lookup; used for prohibited geography override.' },
                    { field: 'domicile', type: 'String (ISO)', pillar: 'Geography', desc: 'Alternative to country_code; jurisdiction of incorporation.' },
                    { field: 'industry_code', type: 'Int / String', pillar: 'Industry', desc: 'SIC or industry classification for industry scorecard lookup.' },
                    { field: 'industry_description', type: 'String', pillar: 'Industry', desc: 'Free-text industry description; used for crypto/ special industry overrides.' },
                    { field: 'sic_codes', type: 'Array<Int>', pillar: 'Industry', desc: 'Standard Industrial Classification codes; used for adult/CBD industry overrides.' },
                    { field: 'entity_type', type: 'String', pillar: 'Entity', desc: 'Entity type (e.g. Limited, LLP) for entity scorecard lookup.' },
                    { field: 'product_data.type', type: 'String', pillar: 'Product', desc: 'Product or account type for product scorecard lookup.' },
                    { field: 'product_type', type: 'String', pillar: 'Product', desc: 'Alternative product type field.' },
                    { field: 'delivery_data.channels', type: 'Array<String>', pillar: 'Delivery', desc: 'Delivery channels (e.g. online, branch); max score across channels.' },
                  ].map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-medium text-slate-700 dark:text-slate-200">{r.field}</td>
                      <td className="px-6 py-4"><span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{r.type}</span></td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{r.pillar}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{r.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h4 className="font-bold text-sm text-amber-800 dark:text-amber-200 mb-2">Override Condition Inputs</h4>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <p><span className="font-mono font-bold">sanction_match</span> (Boolean) — Direct sanctions list match; triggers Sanctions override.</p>
              <p><span className="font-mono font-bold">sanction_likelihood</span> (Number) — Screening likelihood 0–100; e.g. ≥99 triggers Sanctions override.</p>
              <p><span className="font-mono font-bold">pep_count</span> (Int) — PEP associations count; &gt;0 triggers PEP/AM override.</p>
              <p><span className="font-mono font-bold">has_pep</span>, <span className="font-mono font-bold">has_adverse_media</span> (Boolean) — Trigger PEP/AM override.</p>
              <p><span className="font-mono font-bold">geography_prohibited</span> (Boolean) — Country on prohibited list; triggers Geography prohibited override.</p>
              <p><span className="font-mono font-bold">bearer_shares</span> (Boolean) — Presence of bearer shares; triggers Bearer shares override.</p>
            </div>
          </div>
        </section>

        <section className="mb-12 scroll-mt-32" id="payload">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-slate-100"><span className="material-symbols-outlined">code</span></div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sample Payload</h2>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">CRA input schema for batch simulation. Each record is scored using the 5 pillars and override rules.</p>
          <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
              <span className="ml-4 text-xs font-mono text-slate-500">cra_batch_input_v1.0.json</span>
            </div>
            <pre className="p-6 overflow-x-auto font-mono text-sm leading-relaxed text-slate-300 code-scrollbar">
              <code>{`[
  {
    "record_id": "UK-2024-001",
    "entity_name": "Sterling Capital Partners",
    "country_code": "GB",
    "domicile": "GB",
    "industry_code": 6201,
    "entity_type": "Limited",
    "product_data": { "type": "corporate_account" },
    "delivery_data": { "channels": ["online", "branch"] },
    "pep_count": 0,
    "sanction_match": false
  },
  {
    "record_id": "UK-2024-002",
    "entity_name": "Global Horizon Holdings",
    "country_code": "VG",
    "domicile": "VG",
    "industry_code": 6499,
    "entity_type": "Limited",
    "product_data": { "type": "investment_account" },
    "delivery_data": { "channels": ["online"] },
    "pep_count": 2,
    "sanction_match": false
  }
]`}</code>
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DataReference;
