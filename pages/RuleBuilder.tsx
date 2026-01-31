
import React, { useState, useRef, useEffect } from 'react';
import { suggestRuleLogic } from '../services/geminiService';
import { Connection } from '../types';

interface Node {
  id: string;
  type: 'CONDITION' | 'OPERATOR' | 'ACTION';
  title: string;
  desc: string;
  x: number;
  y: number;
  icon: string;
}

interface SavedRule {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  connections: Connection[];
  weights: {
    geography: number;
    product: number;
    identity: number;
  };
}

const RuleBuilder: React.FC = () => {
  // --- Workspace State ---
  const [nodes, setNodes] = useState<Node[]>([
    { id: '1', type: 'CONDITION', title: 'Country High Risk', desc: 'Check UK High-Risk list.', x: 80, y: 100, icon: 'public' },
    { id: '2', type: 'CONDITION', title: 'PEPs List Match', desc: 'FCA PEP database match.', x: 80, y: 220, icon: 'person_search' },
    { id: '3', type: 'OPERATOR', title: 'AND', desc: '', x: 320, y: 160, icon: 'alt_route' },
    { id: '4', type: 'ACTION', title: 'Flag for EDD', desc: 'Enhanced Due Diligence.', x: 550, y: 180, icon: 'flag' },
  ]);

  const [connections, setConnections] = useState<Connection[]>([
    { id: 'c1', from: '1', to: '3', type: 'solid' },
    { id: 'c2', from: '2', to: '3', type: 'solid' },
    { id: 'c3', from: '3', to: '4', type: 'dashed' },
  ]);

  const [ruleName, setRuleName] = useState('UK High Net Worth Screening');
  const [weights, setWeights] = useState({
    geography: 40,
    product: 25,
    identity: 35
  });

  // --- UI/UX State ---
  const [savedRules, setSavedRules] = useState<SavedRule[]>([]);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [drawingConnFrom, setDrawingConnFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const totalWeight = weights.geography + weights.product + weights.identity;

  // --- Initialization & Storage ---
  useEffect(() => {
    refreshSavedRules();
  }, []);

  const refreshSavedRules = () => {
    const raw = localStorage.getItem('cra_saved_rules');
    if (raw) {
      setSavedRules(JSON.parse(raw));
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // --- Rule Management ---
  const handleNewRule = () => {
    setNodes([]);
    setConnections([]);
    setActiveRuleId(null);
    setRuleName('New Risk Strategy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setWeights({ geography: 34, product: 33, identity: 33 });
    setAiPrompt('');
    triggerToast("CANVAS CLEARED");
  };

  const handleSelectRule = (id: string) => {
    if (!id) return;
    const rule = savedRules.find(r => r.id === id);
    if (rule) {
      setNodes(rule.nodes);
      setConnections(rule.connections);
      setRuleName(rule.name);
      setWeights(rule.weights);
      setActiveRuleId(rule.id);
      triggerToast(`LOADED: ${rule.name}`);
    }
  };

  const handleCloneRule = () => {
    if (!activeRuleId) return;
    const newName = window.prompt("Enter a name for your cloned strategy:", ruleName + " (Copy)");
    if (newName) {
      setRuleName(newName);
      setActiveRuleId(null); // Treat as a new, unsaved rule now
      triggerToast("STRATEGY CLONED: Ready to edit & save");
    }
  };

  const handleSaveRule = () => {
    const raw = localStorage.getItem('cra_saved_rules');
    let rules: SavedRule[] = raw ? JSON.parse(raw) : [];
    
    // Check if we are updating an existing rule or saving a new one
    const idToSave = activeRuleId || 'rule-' + Date.now().toString();
    const newRule: SavedRule = {
      id: idToSave,
      name: ruleName,
      description: `Risk strategy updated ${new Date().toLocaleDateString()}`,
      nodes,
      connections,
      weights
    };

    const existingIdx = rules.findIndex(r => r.id === idToSave);
    if (existingIdx >= 0) {
      rules[existingIdx] = newRule;
    } else {
      rules.push(newRule);
    }

    localStorage.setItem('cra_saved_rules', JSON.stringify(rules));
    setActiveRuleId(idToSave);
    refreshSavedRules();
    triggerToast("CHANGES COMMITTED");
  };

  // --- AI Logic ---
  const handleAiSuggest = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
      const result = await suggestRuleLogic(aiPrompt);
      const newNode: Node = {
        id: 'node-' + Date.now().toString(),
        type: 'CONDITION',
        title: result.ruleName,
        desc: result.description,
        x: 200,
        y: 200,
        icon: 'auto_awesome'
      };
      setNodes(prev => [...prev, newNode]);
      setAiPrompt('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- Canvas Interaction Helpers ---
  const getCanvasCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };
  };

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    const coords = getCanvasCoords(e);
    setDraggingNodeId(id);
    setDragOffset({ x: coords.x - node.x, y: coords.y - node.y });
  };

  const onPortMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDrawingConnFrom(id);
    setMousePos(getCanvasCoords(e));
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    setMousePos(coords);
    if (draggingNodeId) {
      setNodes(prev => prev.map(n => 
        n.id === draggingNodeId ? { ...n, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y } : n
      ));
    }
  };

  const onMouseUp = () => {
    setDraggingNodeId(null);
    setDrawingConnFrom(null);
  };

  const onPortMouseUp = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (drawingConnFrom && drawingConnFrom !== targetId) {
      const exists = connections.some(c => c.from === drawingConnFrom && c.to === targetId);
      if (!exists) {
        setConnections(prev => [...prev, {
          id: `c-${Date.now()}`,
          from: drawingConnFrom,
          to: targetId,
          type: 'solid'
        }]);
      }
    }
    setDrawingConnFrom(null);
  };

  const onDropCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const coords = getCanvasCoords(e as any);
    const type = e.dataTransfer.getData('nodeType') as Node['type'];
    const name = e.dataTransfer.getData('nodeName');
    const icon = e.dataTransfer.getData('nodeIcon');

    const newNode: Node = {
      id: 'node-' + Date.now().toString(),
      type,
      title: name,
      desc: `Custom ${type.toLowerCase()} check.`,
      x: coords.x - 80,
      y: coords.y - 35,
      icon
    };
    setNodes(prev => [...prev, newNode]);
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
  };

  const deleteConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  const NODE_WIDTH = 160; 
  const NODE_HEIGHT = 70;

  const getDynamicPath = (startId: string, endId: string) => {
    const start = nodes.find(n => n.id === startId);
    const end = nodes.find(n => n.id === endId);
    if (!start || !end) return "";
    const sx = start.x + NODE_WIDTH;
    const sy = start.y + (NODE_HEIGHT / 2);
    const ex = end.x;
    const ey = end.y + (NODE_HEIGHT / 2);
    const dx = Math.min(Math.abs(ex - sx) * 0.5, 100);
    return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${ex - dx} ${ey}, ${ex} ${ey}`;
  };

  return (
    <div className="flex h-full flex-col select-none relative bg-slate-50 dark:bg-background-dark" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      {showToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white dark:bg-primary px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 text-xs font-black tracking-widest uppercase border border-white/10">
            <span className="material-symbols-outlined !text-lg">info</span> {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 bg-white dark:bg-[#1a202c] border-b border-slate-200 dark:border-slate-800 z-50">
        <div className="flex flex-1 items-center gap-6">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleNewRule} 
              className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white flex items-center justify-center transition-all shadow-sm border border-slate-200 dark:border-slate-700 active:scale-90 group pointer-events-auto" 
              title="Add New Rule (Clear Workspace)"
            >
               <span className="material-symbols-outlined !text-2xl font-bold">add</span>
            </button>
            <div className="flex flex-col min-w-[140px]">
               <label className="text-[9px] uppercase tracking-wider font-black text-slate-400">Library</label>
               <select 
                className="bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-slate-600 dark:text-slate-300 cursor-pointer"
                value={activeRuleId || ''}
                onChange={(e) => handleSelectRule(e.target.value)}
               >
                 <option value="" disabled>Select from My Rules...</option>
                 {savedRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                 {savedRules.length === 0 && <option value="" disabled>No rules found</option>}
               </select>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <div className="flex flex-col min-w-[200px]">
              <label className="text-[9px] uppercase tracking-wider font-black text-slate-400">Strategy Name</label>
              <input 
                className="form-input flex w-full border-none focus:ring-0 bg-transparent h-6 p-0 text-sm font-black text-slate-900 dark:text-white" 
                value={ruleName} 
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Name your rule..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              className="form-input rounded-full border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-8 px-4 text-[11px] min-w-[240px] focus:ring-primary focus:border-primary"
              placeholder="Suggest logic (e.g. 'High risk crypto tx')..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSuggest()}
            />
            <button 
              onClick={handleAiSuggest}
              disabled={isAiLoading}
              className="bg-primary text-white h-8 px-4 rounded-full text-[10px] font-black hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
            >
              <span className="material-symbols-outlined !text-xs">auto_awesome</span>
              {isAiLoading ? 'GENERATING...' : 'SUGGEST'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeRuleId && (
             <button onClick={handleCloneRule} className="h-8 px-4 rounded-full text-[10px] font-black border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined !text-xs">content_copy</span>CLONE & EDIT
             </button>
          )}
          <button onClick={handleSaveRule} className="h-8 px-4 rounded-full text-[10px] font-black bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md">
            <span className="material-symbols-outlined !text-xs">save</span>SAVE CHANGES
          </button>
          <button disabled={totalWeight !== 100} className={`h-8 px-5 rounded-full text-[10px] font-black transition-all shadow-lg ${totalWeight === 100 ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>
            DEPLOY
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Canvas Area */}
        <div 
          ref={canvasRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropCanvas}
          className="relative flex-1 bg-background-light dark:bg-background-dark overflow-hidden canvas-grid"
        >
          <div className="absolute top-4 right-4 z-50 flex flex-col gap-1">
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="w-8 h-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-xl shadow-sm flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined !text-sm">add</span>
            </button>
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))} className="w-8 h-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-xl shadow-sm flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined !text-sm">remove</span>
            </button>
          </div>

          <div 
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top left',
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
            }}
            className="absolute inset-0"
          >
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="5" orientation="auto">
                  <path d="M 0 0 L 10 5 L 0 10 L 2 5 Z" fill="#3b82f6" />
                </marker>
                <marker id="dot" markerWidth="6" markerHeight="6" refX="3" refY="3">
                  <circle cx="3" cy="3" r="2" fill="#3b82f6" />
                </marker>
              </defs>

              {connections.map(c => (
                <g key={c.id} className="pointer-events-auto cursor-pointer connection-group" onClick={() => deleteConnection(c.id)}>
                  <path d={getDynamicPath(c.from, c.to)} fill="none" stroke="transparent" strokeWidth="12" />
                  <path 
                    d={getDynamicPath(c.from, c.to)} 
                    fill="none" 
                    stroke="#cbd5e1" 
                    strokeWidth="1.5"
                    className="connection-base"
                  />
                  <path 
                    d={getDynamicPath(c.from, c.to)} 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="1.5" 
                    className="connection-flow"
                    markerStart="url(#dot)"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              ))}
              
              {drawingConnFrom && (
                <path 
                  d={`M ${nodes.find(n => n.id === drawingConnFrom)!.x + NODE_WIDTH} ${nodes.find(n => n.id === drawingConnFrom)!.y + (NODE_HEIGHT / 2)} L ${mousePos.x} ${mousePos.y}`} 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="2" 
                  strokeDasharray="4,4" 
                  opacity="0.6"
                />
              )}
            </svg>

            {nodes.map(node => (
              <div 
                key={node.id} 
                onMouseDown={(e) => onMouseDown(e, node.id)}
                className={`absolute bg-white dark:bg-[#1a202c] rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm z-10 w-40 transition-shadow ${draggingNodeId === node.id ? 'shadow-lg ring-2 ring-primary/40 z-20' : 'hover:border-primary/50'}`}
                style={{ left: node.x, top: node.y }}
              >
                <div className={`flex items-center justify-between gap-2 p-1.5 border-b border-slate-100 dark:border-slate-800 rounded-t-lg ${node.type === 'CONDITION' ? 'bg-blue-50/30' : node.type === 'ACTION' ? 'bg-emerald-50/30' : 'bg-slate-50/50'}`}>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className={`material-symbols-outlined !text-sm ${node.type === 'CONDITION' ? 'text-primary' : node.type === 'ACTION' ? 'text-emerald-600' : 'text-slate-400'}`}>{node.icon}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{node.type}</span>
                  </div>
                  <button onMouseDown={(e) => e.stopPropagation()} onClick={() => deleteNode(node.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined !text-[12px]">close</span>
                  </button>
                </div>
                <div className="p-2 h-[45px] overflow-hidden">
                  <h3 className="font-bold text-[10px] text-slate-900 dark:text-white leading-tight truncate">{node.title}</h3>
                  <p className="text-[8px] text-slate-500 dark:text-slate-400 leading-tight mt-1 line-clamp-2">{node.desc}</p>
                </div>
                
                {(node.type === 'CONDITION' || node.type === 'OPERATOR') && (
                  <div 
                    onMouseDown={(e) => onPortMouseDown(e, node.id)}
                    className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-slate-900 cursor-crosshair hover:scale-125 transition-transform z-30 shadow-sm"
                  />
                )}
                {(node.type === 'OPERATOR' || node.type === 'ACTION') && (
                  <div 
                    onMouseUp={(e) => onPortMouseUp(e, node.id)}
                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-full border-2 border-white dark:border-slate-900 cursor-crosshair hover:bg-primary transition-colors z-30 shadow-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c] flex flex-col z-50 transition-all duration-300 ${isPaletteOpen ? 'w-56' : 'w-12'}`}>
          <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="flex items-center justify-center h-10 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-colors">
            <span className={`material-symbols-outlined !text-sm transition-transform ${isPaletteOpen ? 'rotate-180' : 'rotate-0'}`}>chevron_left</span>
          </button>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            {isPaletteOpen && <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Logic Library</h2>}
            
            <div className="space-y-1.5">
              {[
                { name: 'Geo Profile', type: 'CONDITION', icon: 'public' },
                { name: 'ID Verify', type: 'CONDITION', icon: 'verified_user' },
                { name: 'Credit Tier', type: 'CONDITION', icon: 'credit_score' },
                { name: 'Sanctions', type: 'CONDITION', icon: 'gavel' }
              ].map((c, i) => (
                <div 
                  key={i} draggable 
                  onDragStart={(e) => { e.dataTransfer.setData('nodeType', c.type); e.dataTransfer.setData('nodeName', c.name); e.dataTransfer.setData('nodeIcon', c.icon); }}
                  className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-primary/5 cursor-grab group transition-all"
                >
                  <span className="material-symbols-outlined text-primary !text-lg">{c.icon}</span>
                  {isPaletteOpen && <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{c.name}</span>}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
              <div className={`grid ${isPaletteOpen ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                {['AND', 'OR'].map(op => (
                  <div 
                    key={op} draggable
                    onDragStart={(e) => { e.dataTransfer.setData('nodeType', 'OPERATOR'); e.dataTransfer.setData('nodeName', op); e.dataTransfer.setData('nodeIcon', 'alt_route'); }}
                    className="flex items-center justify-center py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-900 hover:text-white dark:hover:bg-primary cursor-grab font-black text-[10px] transition-colors"
                  >
                    {op}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-1.5">
              {[
                { name: 'Flag Alert', type: 'ACTION', icon: 'flag' },
                { name: 'Block Tx', type: 'ACTION', icon: 'block' },
                { name: 'Manual EDD', type: 'ACTION', icon: 'assignment_ind' }
              ].map((a, i) => (
                <div 
                  key={i} draggable
                  onDragStart={(e) => { e.dataTransfer.setData('nodeType', 'ACTION'); e.dataTransfer.setData('nodeName', a.name); e.dataTransfer.setData('nodeIcon', a.icon); }}
                  className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-grab group transition-all"
                >
                  <span className="material-symbols-outlined text-emerald-600 !text-lg">{a.icon}</span>
                  {isPaletteOpen && <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{a.name}</span>}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="bg-white dark:bg-[#1a202c] border-t border-slate-200 dark:border-slate-800 z-50">
        <div 
          onClick={() => setIsConfigExpanded(!isConfigExpanded)}
          className="px-6 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined !text-sm text-primary transition-transform ${isConfigExpanded ? 'rotate-0' : 'rotate-180'}`}>expand_more</span>
            <span className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Risk Matrix Weights</span>
          </div>
          <span className={`text-[10px] font-black px-4 py-1 rounded-full ${totalWeight === 100 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse'}`}>
            Sum: {totalWeight}% {totalWeight !== 100 && '(Must equal 100%)'}
          </span>
        </div>
        
        {isConfigExpanded && (
          <div className="px-6 py-5 grid grid-cols-2 gap-12 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
              {[
                { label: 'Geography', key: 'geography', color: 'accent-emerald-500' },
                { label: 'Product Type', key: 'product', color: 'accent-amber-500' },
                { label: 'Entity Identity', key: 'identity', color: 'accent-primary' }
              ].map((p) => (
                <div key={p.key} className="flex items-center gap-6">
                  <span className="text-[11px] font-bold w-24 text-slate-600 dark:text-slate-400">{p.label}</span>
                  <input 
                    type="range" min="0" max="100"
                    className={`flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer ${p.color}`} 
                    value={(weights as any)[p.key]}
                    onChange={(e) => setWeights({ ...weights, [p.key]: parseInt(e.target.value) })}
                  />
                  <span className="text-[11px] font-black text-slate-900 dark:text-white w-8 text-right">{(weights as any)[p.key]}%</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center">
               <div className="flex h-10 w-full rounded-xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden shadow-inner bg-slate-50 dark:bg-slate-900">
                <div className="bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center transition-all duration-500" style={{ width: `${(weights.geography / totalWeight) * 100}%` }}>GEO</div>
                <div className="bg-amber-400 text-white text-[9px] font-black flex items-center justify-center transition-all duration-500" style={{ width: `${(weights.product / totalWeight) * 100}%` }}>PROD</div>
                <div className="bg-primary text-white text-[9px] font-black flex items-center justify-center transition-all duration-500" style={{ width: `${(weights.identity / totalWeight) * 100}%` }}>ID</div>
              </div>
              <p className="mt-3 text-[9px] text-slate-400 text-center font-medium italic">Relative contribution to total risk score.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleBuilder;
