import React, { useState, useRef, useEffect, useMemo } from 'react';
import { suggestRuleLogicWithFallback } from '../services/geminiService';
import { Connection, CRAWeights, OverrideRule, RiskBand, ComponentDefaults, OverrideConditionType } from '../types';
import { loadCRAEngineConfig, saveCRAEngineConfig } from '../services/craEngineConfig';
import { getRuleSetSummaryConcise } from '../services/craRuleSetSummary';
import { getBlocksByCategory, LogicBlock, findBlockByName } from '../services/logicLibraryConfig';
import { FCA_PREDEFINED_RULES, isPredefinedRuleId } from '../services/fcaPredefinedRules';

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
  weights: CRAWeights;
}

const AI_LAYOUT = { baseX: 200, baseY: 80, colGap: 220, rowGap: 70 } as const;

const RuleBuilder: React.FC = () => {
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
  const [weights, setWeights] = useState<CRAWeights>(() => loadCRAEngineConfig().weights);
  const [componentDefaults, setComponentDefaults] = useState<ComponentDefaults>(() => loadCRAEngineConfig().componentDefaults);
  const [overrideRules, setOverrideRules] = useState<OverrideRule[]>(() => loadCRAEngineConfig().overrideRules);
  const [riskBands, setRiskBands] = useState<RiskBand[]>(() => loadCRAEngineConfig().riskBands);
  const [prohibitedCountries, setProhibitedCountries] = useState<string[]>(() => loadCRAEngineConfig().prohibitedCountries);

  const [savedRules, setSavedRules] = useState<SavedRule[]>([]);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [isCraConfigExpanded, setIsCraConfigExpanded] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [logicLibrarySearch, setLogicLibrarySearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set(['Geography', 'Screening', 'Escalation', 'Operators']));
  const [zoom, setZoom] = useState(1);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [drawingConnFrom, setDrawingConnFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const totalWeightPercent = Math.round((weights.geo + weights.ind + weights.ent + weights.prod + weights.deliv) * 100);

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

  const persistCRAConfig = () => {
    saveCRAEngineConfig({ weights, componentDefaults, overrideRules, riskBands, prohibitedCountries });
  };

  const migrateWeights = (w: unknown): CRAWeights => {
    if (w && typeof w === 'object') {
      const o = w as Record<string, number>;
      if ('geo' in o && 'ind' in o) return o as CRAWeights;
      if ('geography' in o) {
        const g = (o.geography ?? 33) / 100;
        const p = (o.product ?? 33) / 100;
        const i = (o.identity ?? 34) / 100;
        return { geo: g * 0.9, ind: 0.1, ent: i * 0.5, prod: p, deliv: 0.05 };
      }
    }
    return loadCRAEngineConfig().weights;
  };

  const handleNewRule = () => {
    setNodes([]);
    setConnections([]);
    setActiveRuleId(null);
    setRuleName('New Risk Strategy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setWeights(loadCRAEngineConfig().weights);
    setAiPrompt('');
    triggerToast("CANVAS CLEARED");
  };

  const handleSelectRule = (id: string) => {
    if (!id) return;
    if (isPredefinedRuleId(id)) {
      const rule = FCA_PREDEFINED_RULES.find(r => r.id === id);
      if (rule) {
        setNodes(rule.nodes as Node[]);
        setConnections(rule.connections);
        setRuleName(rule.name);
        setWeights(rule.weights);
        setActiveRuleId(rule.id);
        triggerToast(`LOADED: ${rule.name}`);
      }
      return;
    }
    const rule = savedRules.find(r => r.id === id);
    if (rule) {
      setNodes(rule.nodes);
      setConnections(rule.connections);
      setRuleName(rule.name);
      setWeights(migrateWeights(rule.weights));
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
    const isPredefined = activeRuleId ? isPredefinedRuleId(activeRuleId) : false;
    const idToSave = isPredefined ? 'rule-' + Date.now().toString() : (activeRuleId || 'rule-' + Date.now().toString());
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
    persistCRAConfig();
    refreshSavedRules();
    triggerToast(isPredefined ? "Saved as new rule (template preserved)" : "CHANGES COMMITTED");
  };

  const handleAiSuggest = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
      const result = await suggestRuleLogicWithFallback(aiPrompt);
      if (result._fromFallback) triggerToast('Suggestion from FCA library (API unavailable)');

      const conditionBlocks = result.conditionNames
        .map((name) => findBlockByName(name))
        .filter((b): b is LogicBlock => b != null);
      const operatorBlock = findBlockByName(result.operatorName);
      const actionBlocks = result.actionNames
        .map((name) => findBlockByName(name))
        .filter((b): b is LogicBlock => b != null);

      if (conditionBlocks.length === 0 || !operatorBlock || actionBlocks.length === 0) {
        triggerToast('Could not map suggestion to Logic Library blocks.');
        return;
      }

      const ts = Date.now();
      const { baseX, baseY, colGap, rowGap } = AI_LAYOUT;
      const centerY = baseY + ((conditionBlocks.length - 1) * rowGap) / 2;
      const actionStartY = centerY - ((actionBlocks.length - 1) * rowGap) / 2;

      const blockToNode = (b: LogicBlock, suffix: string, x: number, y: number): Node => ({
        id: `node-${ts}-${suffix}`,
        type: b.type as Node['type'],
        title: b.name,
        desc: b.desc,
        x,
        y,
        icon: b.icon,
      });

      const conditionNodes = conditionBlocks.map((b, i) =>
        blockToNode(b, `cond-${i}`, baseX, baseY + i * rowGap)
      );
      const operatorNode = blockToNode(
        operatorBlock,
        'op',
        baseX + colGap,
        baseY + ((conditionBlocks.length - 1) * rowGap) / 2
      );
      const actionNodes = actionBlocks.map((b, i) =>
        blockToNode(b, `act-${i}`, baseX + 2 * colGap, actionStartY + i * rowGap)
      );

      const newConnections: Connection[] = [
        ...conditionNodes.map((n) => ({ id: `conn-${ts}-${n.id}-op`, from: n.id, to: operatorNode.id, type: 'solid' as const })),
        ...actionNodes.map((n) => ({ id: `conn-${ts}-op-${n.id}`, from: operatorNode.id, to: n.id, type: 'dashed' as const })),
      ];

      setNodes((prev) => [...prev, ...conditionNodes, operatorNode, ...actionNodes]);
      setConnections((prev) => [...prev, ...newConnections]);
      if (result.ruleName) setRuleName(result.ruleName);
      setAiPrompt('');
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'AI suggestion failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

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
    const desc = e.dataTransfer.getData('nodeDesc') || `Custom ${type.toLowerCase()} check.`;

    const newNode: Node = {
      id: 'node-' + Date.now().toString(),
      type,
      title: name,
      desc,
      x: coords.x - 80,
      y: coords.y - 35,
      icon
    };
    setNodes(prev => [...prev, newNode]);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const groupedBlocks = useMemo(() => {
    const q = logicLibrarySearch.trim().toLowerCase();
    const groups = getBlocksByCategory();
    if (!q) return groups;
    return groups
      .map(g => ({ ...g, blocks: g.blocks.filter(b => b.name.toLowerCase().includes(q) || b.desc.toLowerCase().includes(q)) }))
      .filter(g => g.blocks.length > 0);
  }, [logicLibrarySearch]);

  const handleDragStart = (block: LogicBlock) => (e: React.DragEvent) => {
    e.dataTransfer.setData('nodeType', block.type);
    e.dataTransfer.setData('nodeName', block.name);
    e.dataTransfer.setData('nodeIcon', block.icon);
    e.dataTransfer.setData('nodeDesc', block.desc);
  };

  const jsonPreviewPayload = useMemo(() => ({
    rule: {
      ruleName,
      ruleId: activeRuleId ?? null,
      nodes,
      connections,
      weights: {
        geo: Math.round(weights.geo * 100) / 100,
        ind: Math.round(weights.ind * 100) / 100,
        ent: Math.round(weights.ent * 100) / 100,
        prod: Math.round(weights.prod * 100) / 100,
        deliv: Math.round(weights.deliv * 100) / 100,
      },
    },
    craConfig: {
      componentDefaults,
      overrideRules: [...overrideRules].sort((a, b) => a.priority - b.priority).map(({ id, name, conditionType, resultScore, priority, config }) => ({ id, name, conditionType, resultScore, priority, ...(config && Object.keys(config).length > 0 ? { config } : {}) })),
      riskBands,
      prohibitedCountries,
    },
  }), [activeRuleId, ruleName, nodes, connections, weights, componentDefaults, overrideRules, riskBands, prohibitedCountries]);

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

      {showJsonPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowJsonPreview(false)}>
          <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">JSON Preview</h3>
              <button type="button" onClick={() => setShowJsonPreview(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined !text-lg">close</span>
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-b-xl whitespace-pre-wrap break-words">
              <code>{JSON.stringify(jsonPreviewPayload, null, 2)}</code>
            </pre>
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
            <div className="flex flex-col min-w-[200px]">
               <label className="text-[9px] uppercase tracking-wider font-black text-slate-400">Library</label>
               <select 
                className="bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-slate-600 dark:text-slate-300 cursor-pointer"
                value={activeRuleId || ''}
                onChange={(e) => handleSelectRule(e.target.value)}
               >
                 <option value="" disabled>Select a rule...</option>
                 <optgroup label="FCA & UK Compliance Templates">
                   {FCA_PREDEFINED_RULES.map(r => (
                     <option key={r.id} value={r.id}>{r.name}</option>
                   ))}
                 </optgroup>
                 <optgroup label="My Rules">
                   {savedRules.map(r => (
                     <option key={r.id} value={r.id}>{r.name}</option>
                   ))}
                 </optgroup>
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
          <button
            type="button"
            onClick={() => setShowJsonPreview(true)}
            className="h-8 px-4 rounded-full text-[10px] font-black border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
            title="View JSON of current selections"
          >
            <span className="material-symbols-outlined !text-xs">code</span>JSON PREVIEW
          </button>
          {activeRuleId && (
             <button onClick={handleCloneRule} className="h-8 px-4 rounded-full text-[10px] font-black border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined !text-xs">content_copy</span>CLONE & EDIT
             </button>
          )}
          <button onClick={handleSaveRule} className="h-8 px-4 rounded-full text-[10px] font-black bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md">
            <span className="material-symbols-outlined !text-xs">save</span>SAVE CHANGES
          </button>
          <button
            disabled={Math.abs(totalWeightPercent - 100) > 1}
            onClick={persistCRAConfig}
            className={`h-8 px-5 rounded-full text-[10px] font-black transition-all shadow-lg ${Math.abs(totalWeightPercent - 100) <= 1 ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
          >
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

            {/* Rule set summary: vertical tile (replaces CRA output card), updates with canvas + CRA config + weights */}
            {(() => {
              const summary = getRuleSetSummaryConcise(
                { weights, componentDefaults, overrideRules, riskBands, prohibitedCountries },
                nodes.map((n) => ({ type: n.type, title: n.title }))
              );
              return (
                <div
                  id="rule-set-summary-tile"
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-40 rounded-lg border-2 border-primary/30 bg-white dark:bg-[#1a202c] shadow-md pointer-events-none select-none flex flex-col min-h-[200px]"
                  title="Rule set summary: canvas flow + CRA weights, overrides, prohibited"
                >
                  <div className="flex items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-700 rounded-t-lg bg-primary/5 shrink-0">
                    <span className="material-symbols-outlined !text-sm text-primary">summarize</span>
                    <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Rule set summary</span>
                  </div>
                  <div className="p-2.5 space-y-2 flex-1 text-[9px] leading-tight">
                    <div>
                      <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Canvas</p>
                      <p className="text-slate-700 dark:text-slate-300">{summary.canvas}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Weights</p>
                      <p className="text-slate-700 dark:text-slate-300 break-words">{summary.weights}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Overrides</p>
                      <p className="text-slate-700 dark:text-slate-300">{summary.overrides}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Prohibited</p>
                      <p className="text-slate-700 dark:text-slate-300 truncate" title={summary.prohibited}>{summary.prohibited}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Sidebar - Logic Library */}
        <aside className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a202c] flex flex-col z-50 transition-all duration-300 ${isPaletteOpen ? 'w-72' : 'w-12'}`}>
          <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="flex items-center justify-center h-10 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-colors">
            <span className={`material-symbols-outlined !text-sm transition-transform ${isPaletteOpen ? 'rotate-180' : 'rotate-0'}`}>chevron_left</span>
          </button>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {isPaletteOpen && (
              <>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Logic Library</h2>
                <div className="relative mb-4">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined !text-sm">search</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Search blocks..."
                    value={logicLibrarySearch}
                    onChange={(e) => setLogicLibrarySearch(e.target.value)}
                    className="form-input w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs focus:ring-primary focus:border-primary"
                  />
                </div>

                {groupedBlocks.map(({ type, category, blocks }) => {
                  const isExpanded = expandedCategories.has(category);
                  const iconColor = type === 'CONDITION' ? 'text-primary' : type === 'ACTION' ? 'text-emerald-600' : 'text-slate-500';
                  const borderHover = type === 'CONDITION' ? 'hover:border-primary/30 hover:bg-primary/5' : type === 'ACTION' ? 'hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/10' : 'hover:bg-slate-100 dark:hover:bg-slate-800';

                  return (
                    <div key={`${type}-${category}`} className="border-t border-slate-100 dark:border-slate-800 pt-3 first:border-t-0 first:pt-0">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="flex items-center justify-between w-full px-1 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                      >
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {category} ({blocks.length})
                        </span>
                        <span className={`material-symbols-outlined !text-sm transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>expand_more</span>
                      </button>
                      {isExpanded && (
                        <div className={`mt-1.5 ${category === 'Operators' ? 'grid grid-cols-2 gap-2' : 'space-y-1'}`}>
                          {blocks.map((block) => (
                            <div
                              key={block.id}
                              draggable
                              onDragStart={handleDragStart(block)}
                              title={block.desc}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border border-slate-100 dark:border-slate-800 cursor-grab active:cursor-grabbing transition-all ${borderHover} ${category === 'Operators' ? 'justify-center font-black text-[10px]' : ''}`}
                            >
                              <span className={`material-symbols-outlined !text-base shrink-0 ${iconColor}`}>{block.icon}</span>
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate flex-1">{block.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {groupedBlocks.length === 0 && logicLibrarySearch.trim() && (
                  <p className="text-xs text-slate-400 italic px-1">No blocks match "{logicLibrarySearch}"</p>
                )}
              </>
            )}
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
            <span className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">5 Pillar Weights (CRA Engine)</span>
          </div>
          <span className={`text-[10px] font-black px-4 py-1 rounded-full ${Math.abs(totalWeightPercent - 100) <= 1 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse'}`}>
            Sum: {totalWeightPercent}% {Math.abs(totalWeightPercent - 100) > 1 && '(Must equal 100%)'}
          </span>
        </div>
        
        {isConfigExpanded && (
          <div className="border-t border-slate-100 dark:border-slate-800 max-h-[280px] overflow-y-auto overflow-x-hidden animate-in slide-in-from-bottom-2 duration-300">
            <div className="px-6 py-5 grid grid-cols-2 gap-8 space-y-0">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Weight allocation</h4>
                {[
                  { label: 'Geography', key: 'geo' as const, color: 'accent-emerald-500' },
                  { label: 'Industry', key: 'ind' as const, color: 'accent-amber-500' },
                  { label: 'Entity', key: 'ent' as const, color: 'accent-primary' },
                  { label: 'Product', key: 'prod' as const, color: 'accent-violet-500' },
                  { label: 'Delivery', key: 'deliv' as const, color: 'accent-cyan-500' },
                ].map((p) => (
                  <div key={p.key} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold w-20 text-slate-600 dark:text-slate-400 shrink-0">{p.label}</span>
                    <input 
                      type="range" min="0" max="100"
                      className={`flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer ${p.color}`} 
                      value={Math.round(weights[p.key] * 100)}
                      onChange={(e) => setWeights({ ...weights, [p.key]: parseInt(e.target.value) / 100 })}
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-8 text-right tabular-nums">{Math.round(weights[p.key] * 100)}%</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                  <div className="bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-500" style={{ width: `${weights.geo * 100}%` }}>GEO</div>
                  <div className="bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-500" style={{ width: `${weights.ind * 100}%` }}>IND</div>
                  <div className="bg-primary text-white text-[10px] font-bold flex items-center justify-center transition-all duration-500" style={{ width: `${weights.ent * 100}%` }}>ENT</div>
                  <div className="bg-violet-400 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-500" style={{ width: `${weights.prod * 100}%` }}>PROD</div>
                  <div className="bg-cyan-400 text-white text-[10px] font-bold flex items-center justify-center transition-all duration-500" style={{ width: `${weights.deliv * 100}%` }}>DELIV</div>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Pre-override score (Σ = 1)</p>
              </div>
            </div>
          </div>
        )}

        {/* CRA Engine Config: Overrides, Risk Bands, Defaults, Prohibited Geography */}
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div 
            onClick={() => setIsCraConfigExpanded(!isCraConfigExpanded)}
            className="px-6 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined !text-sm text-primary transition-transform ${isCraConfigExpanded ? 'rotate-0' : 'rotate-180'}`}>expand_more</span>
              <span className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">CRA Engine Config</span>
            </div>
          </div>
          {isCraConfigExpanded && (
            <div className="border-t border-slate-100 dark:border-slate-800 max-h-[320px] overflow-y-auto overflow-x-hidden animate-in slide-in-from-bottom-2 duration-300">
              <div className="px-6 py-5 space-y-6">
              {/* Component Defaults */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Component Defaults (1–5)</h4>
                <div className="flex flex-wrap gap-4">
                  {(['geo', 'ind', 'ent', 'prod', 'deliv'] as const).map((k) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 w-12 shrink-0">{k.toUpperCase()}</span>
                      <input 
                        type="number" min="1" max="5" 
                        className="w-12 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-center py-1.5 px-1 text-slate-700 dark:text-slate-300"
                        value={componentDefaults[k]}
                        onChange={(e) => setComponentDefaults({ ...componentDefaults, [k]: Math.min(5, Math.max(1, parseInt(e.target.value) || 3)) })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Override Rules Manager */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Override Rules (Priority Order)</h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">Priority</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">Name</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">Condition</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">Score</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[...overrideRules].sort((a, b) => a.priority - b.priority).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-3 py-1.5 text-[11px] font-mono text-slate-700 dark:text-slate-300">{r.priority}</td>
                          <td className="px-3 py-1.5"><input value={r.name} onChange={(e) => setOverrideRules(overrideRules.map(x => x.id === r.id ? { ...x, name: e.target.value } : x))} className="w-full min-w-[100px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300" /></td>
                          <td className="px-3 py-1.5">
                            <select value={r.conditionType} onChange={(e) => setOverrideRules(overrideRules.map(x => x.id === r.id ? { ...x, conditionType: e.target.value as OverrideConditionType } : x))} className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold py-1.5 px-2 text-slate-700 dark:text-slate-300">
                              {(['geography_prohibited', 'sanctions', 'pep_am', 'shell_company', 'industry_cbd', 'industry_crypto', 'bearer_shares', 'adult_entertainment'] as OverrideConditionType[]).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-1.5"><input type="number" min="1" max="5" value={r.resultScore} onChange={(e) => setOverrideRules(overrideRules.map(x => x.id === r.id ? { ...x, resultScore: Math.min(5, Math.max(1, parseInt(e.target.value) || 5)) } : x))} className="w-10 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300" /></td>
                          <td className="px-3 py-1.5 flex gap-0.5">
                            <button type="button" onClick={() => { const idx = overrideRules.findIndex(x => x.id === r.id); if (idx > 0) { const arr = [...overrideRules]; [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]; arr.forEach((a, i) => a.priority = i+1); setOverrideRules(arr); } }} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400" title="Move up"><span className="material-symbols-outlined !text-sm">arrow_upward</span></button>
                            <button type="button" onClick={() => { const idx = overrideRules.findIndex(x => x.id === r.id); if (idx < overrideRules.length - 1) { const arr = [...overrideRules]; [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]]; arr.forEach((a, i) => a.priority = i+1); setOverrideRules(arr); } }} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400" title="Move down"><span className="material-symbols-outlined !text-sm">arrow_downward</span></button>
                            <button type="button" onClick={() => setOverrideRules(overrideRules.filter(x => x.id !== r.id))} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500" title="Delete"><span className="material-symbols-outlined !text-sm">delete</span></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={() => setOverrideRules([...overrideRules, { id: 'ov-' + Date.now(), name: 'New Override', conditionType: 'geography_prohibited', resultScore: 5, priority: overrideRules.length + 1 }])} className="mt-2 text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined !text-sm">add</span> Add Override
                </button>
              </div>

              {/* Risk Bands Editor */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Risk Bands</h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">Name</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">Min</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">Max</th>
                        <th className="px-3 py-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 w-14"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {riskBands.map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-3 py-1.5"><input value={b.name} onChange={(e) => setRiskBands(riskBands.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} className="w-full min-w-[90px] rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300" /></td>
                          <td className="px-3 py-1.5"><input type="number" min="0" max="5" step="0.1" className="w-14 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300" value={b.min} onChange={(e) => setRiskBands(riskBands.map((x, i) => i === idx ? { ...x, min: parseFloat(e.target.value) || 0 } : x))} /></td>
                          <td className="px-3 py-1.5"><input type="number" min="0" max="5" step="0.1" className="w-14 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300" value={b.max} onChange={(e) => setRiskBands(riskBands.map((x, i) => i === idx ? { ...x, max: parseFloat(e.target.value) || 5 } : x))} /></td>
                          <td className="px-3 py-1.5"><button type="button" onClick={() => setRiskBands(riskBands.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"><span className="material-symbols-outlined !text-sm">delete</span></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={() => setRiskBands([...riskBands, { name: 'New Band', min: 0, max: 1 }])} className="mt-2 text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined !text-sm">add</span> Add Band
                </button>
              </div>

              {/* Prohibited Geography */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Prohibited Countries (ISO)</h4>
                <div className="flex flex-wrap gap-2">
                  {prohibitedCountries.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {c} <button type="button" onClick={() => setProhibitedCountries(prohibitedCountries.filter(x => x !== c))} className="hover:text-red-500"><span className="material-symbols-outlined !text-sm">close</span></button>
                    </span>
                  ))}
                  <form onSubmit={(e) => { e.preventDefault(); const inp = (e.currentTarget.elements.namedItem('iso') as HTMLInputElement); const v = inp?.value?.trim().toUpperCase(); if (v && v.length === 2 && !prohibitedCountries.includes(v)) { setProhibitedCountries([...prohibitedCountries, v]); inp.value = ''; } }} className="flex gap-1">
                    <input name="iso" placeholder="e.g. IR" maxLength={2} className="w-14 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center py-1.5 px-1 text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300" />
                    <button type="submit" className="px-2 py-1.5 rounded border border-primary bg-primary text-white text-[11px] font-bold">Add</button>
                  </form>
                </div>
              </div>

              <button type="button" onClick={persistCRAConfig} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined !text-sm">save</span> Save CRA Config
              </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RuleBuilder;
