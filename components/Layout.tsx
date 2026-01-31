import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c] px-6 py-3 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
              <span className="material-symbols-outlined">account_tree</span>
            </div>
            <h2 className="text-[#111318] dark:text-white text-xl font-black leading-tight tracking-tighter">FinCRA</h2>
          </Link>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
          <nav className="flex items-center gap-1">
            <NavLink 
              to="/" 
              className={({ isActive }) => `flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="material-symbols-outlined !text-lg">explore</span>
              Journey
            </NavLink>
            <NavLink 
              to="/reference" 
              className={({ isActive }) => `flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="material-symbols-outlined !text-lg">database</span>
              Data Sources
            </NavLink>
            <NavLink 
              to="/rules" 
              className={({ isActive }) => `flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="material-symbols-outlined !text-lg">schema</span>
              Rule Builder
            </NavLink>
            <NavLink 
              to="/simulations" 
              className={({ isActive }) => `flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${isActive ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="material-symbols-outlined !text-lg">analytics</span>
              Simulation
            </NavLink>
            <NavLink 
              to="/governance" 
              className={({ isActive }) => `flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <span className="material-symbols-outlined !text-lg">policy</span>
              Governance
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Environment Live</span>
          </div>
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border-2 border-white dark:border-slate-700 shadow-sm" style={{ backgroundImage: 'url("https://picsum.photos/seed/compliance-user/100/100")' }}></div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

export default Layout;