import { useState } from 'react';
import { mockPatterns, Pattern } from '@/data/mockData';
import { Plus, Search, Edit, Power, X, Minus, Layers, Trash2, Copy, Eye, ChevronDown } from 'lucide-react';

type ColorToken = 'blue' | 'red' | 'white' | 'blaze' | 'red-blue' | 'blue-red' | 'red-white' | 'blue-white';

interface PatternConfig {
  name: string;
  description: string;
  status: 'active' | 'inactive';
  mode: 'when_exit' | 'when_not_exit';
  colors: ColorToken[];
  numbers: number[];
  gales: number;
  victoryTarget: 'reds' | 'blacks' | 'whites' | 'blacks-whites' | 'reds-whites' | 'any';
}

const colorTokens: { id: ColorToken; border: string; bg: string; inner?: string; split?: [string, string] }[] = [
  { id: 'blue', border: 'border-primary', bg: 'bg-primary' },
  { id: 'red', border: 'border-secondary', bg: 'bg-secondary' },
  { id: 'white', border: 'border-border', bg: 'bg-white' },
  { id: 'blaze', border: 'border-secondary', bg: 'bg-secondary', inner: '🔥' },
  { id: 'red-blue', border: 'border-secondary', bg: '', split: ['bg-secondary', 'bg-primary'] },
  { id: 'blue-red', border: 'border-primary', bg: '', split: ['bg-primary', 'bg-secondary'] },
  { id: 'red-white', border: 'border-secondary', bg: '', split: ['bg-secondary', 'bg-white'] },
  { id: 'blue-white', border: 'border-primary', bg: '', split: ['bg-primary', 'bg-white'] },
];

const numberColors: Record<number, { bg: string; text: string }> = {
  0: { bg: 'bg-white', text: 'text-zinc-900' },
  1: { bg: 'bg-secondary', text: 'text-white' },
  2: { bg: 'bg-secondary', text: 'text-white' },
  3: { bg: 'bg-secondary', text: 'text-white' },
  4: { bg: 'bg-secondary', text: 'text-white' },
  5: { bg: 'bg-secondary', text: 'text-white' },
  6: { bg: 'bg-secondary', text: 'text-white' },
  7: { bg: 'bg-secondary', text: 'text-white' },
  8: { bg: 'bg-zinc-800', text: 'text-white' },
  9: { bg: 'bg-zinc-800', text: 'text-white' },
  10: { bg: 'bg-zinc-800', text: 'text-white' },
  11: { bg: 'bg-zinc-800', text: 'text-white' },
  12: { bg: 'bg-zinc-800', text: 'text-white' },
  13: { bg: 'bg-zinc-800', text: 'text-white' },
  14: { bg: 'bg-zinc-800', text: 'text-white' },
};

const defaultConfig: PatternConfig = {
  name: '',
  description: '',
  status: 'active',
  mode: 'when_exit',
  colors: [],
  numbers: [],
  gales: 2,
  victoryTarget: 'reds',
};

const Patterns = () => {
  const [patterns, setPatterns] = useState<Pattern[]>(mockPatterns);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [config, setConfig] = useState<PatternConfig>({ ...defaultConfig });

  const filtered = patterns.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setConfig({ ...defaultConfig });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Pattern) => {
    setConfig({
      name: p.name,
      description: p.description,
      status: p.status,
      mode: 'when_exit',
      colors: [],
      numbers: [],
      gales: 2,
      victoryTarget: 'reds',
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!config.name.trim()) return;
    const colorsStr = config.colors.join(', ');
    const numbersStr = config.numbers.join(', ');
    const params = `Cores: [${colorsStr}] | Números: [${numbersStr}] | Gales: ${config.gales} | Vitória: ${config.victoryTarget}`;
    const rules = `Modo: ${config.mode === 'when_exit' ? 'Quando sair' : 'Quando não sair'}`;

    if (editingId) {
      setPatterns(prev => prev.map(p => p.id === editingId ? { ...p, name: config.name, description: config.description, status: config.status, parameters: params, rules } : p));
    } else {
      setPatterns(prev => [...prev, { id: Date.now().toString(), name: config.name, description: config.description, status: config.status, parameters: params, rules, createdAt: new Date().toISOString().split('T')[0] }]);
    }
    setShowForm(false);
  };

  const toggleColor = (c: ColorToken) => {
    setConfig(prev => ({
      ...prev,
      colors: prev.colors.includes(c) ? prev.colors.filter(x => x !== c) : [...prev.colors, c],
    }));
  };

  const toggleNumber = (n: number) => {
    setConfig(prev => ({
      ...prev,
      numbers: prev.numbers.includes(n) ? prev.numbers.filter(x => x !== n) : [...prev.numbers, n],
    }));
  };

  const toggleStatus = (id: string) => {
    setPatterns(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p));
  };

  const deletePattern = (id: string) => {
    setPatterns(prev => prev.filter(p => p.id !== id));
  };

  // Empty state
  if (patterns.length === 0 && !showForm) {
    return (
      <div className="space-y-6 animate-fade-in pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Padrões</h1>
            <p className="text-sm text-muted-foreground/70 mt-1">Configure padrões de detecção para sinais</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-semibold text-xs tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
            <Plus size={16} /> NOVO PADRÃO
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-5 shadow-lg shadow-primary/10">
            <Layers size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Adicione um padrão</h2>
          <p className="text-sm text-muted-foreground/50 text-center max-w-sm mb-6">
            Clique no botão abaixo e adicione seu primeiro padrão. Você poderá adicionar e acompanhar múltiplos padrões.
          </p>
          <button onClick={openNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-semibold text-sm tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
            <Plus size={16} /> NOVO PADRÃO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Padrões</h1>
          <p className="text-sm text-muted-foreground/70 mt-1">Configure padrões de detecção para sinais</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-semibold text-xs tracking-wide hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
          <Plus size={16} /> NOVO PADRÃO
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar padrões..."
          className="w-full bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
      </div>

      {/* Pattern list */}
      <div className="space-y-2.5">
        {filtered.map(p => (
          <div key={p.id} className={`rounded-2xl p-4 border backdrop-blur-sm transition-all ${p.status === 'active' ? 'border-primary/20 bg-primary/[0.03]' : 'border-border/20 bg-card/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === 'active' ? 'bg-primary/15 border border-primary/25' : 'bg-muted/30 border border-border/30'}`}>
                  <Layers size={18} className={p.status === 'active' ? 'text-primary' : 'text-muted-foreground/50'} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground/50">{p.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-lg ${p.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-muted/30 text-muted-foreground/50 border border-border/20'}`}>
                  {p.status === 'active' ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/10">
              <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/40 border border-border/20 text-xs text-muted-foreground hover:text-foreground hover:border-border/40 transition-all">
                <Edit size={12} /> Editar
              </button>
              <button onClick={() => toggleStatus(p.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${p.status === 'active' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-card/40 border-border/20 text-muted-foreground hover:text-foreground'}`}>
                <Power size={12} /> {p.status === 'active' ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={() => deletePattern(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/5 border border-secondary/15 text-xs text-secondary/70 hover:text-secondary hover:border-secondary/30 transition-all">
                <Trash2 size={12} /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pattern Builder Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl bg-card/95 backdrop-blur-xl rounded-3xl border border-border/30 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/20">
              <div>
                <h3 className="text-lg font-bold text-foreground">{editingId ? 'Editar Padrão' : 'Novo Padrão'}</h3>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">Configure as condições do padrão</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1.5">Nome do padrão</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
                    placeholder="Ex: Sequência Alpha-7"
                    maxLength={50}
                    className="w-full bg-muted/20 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1.5">Descrição</label>
                  <input
                    type="text"
                    value={config.description}
                    onChange={e => setConfig(c => ({ ...c, description: e.target.value }))}
                    placeholder="Descreva o padrão"
                    maxLength={100}
                    className="w-full bg-muted/20 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              {/* Mode Toggle */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">Condição</label>
                <div className="flex p-1 rounded-2xl bg-muted/20 border border-border/30">
                  <button
                    onClick={() => setConfig(c => ({ ...c, mode: 'when_exit' }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 ${
                      config.mode === 'when_exit'
                        ? 'bg-primary/20 text-primary border border-primary/25 shadow-lg shadow-primary/10'
                        : 'text-muted-foreground/50'
                    }`}
                  >
                    ✅ QUANDO SAIR
                  </button>
                  <button
                    onClick={() => setConfig(c => ({ ...c, mode: 'when_not_exit' }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                      config.mode === 'when_not_exit'
                        ? 'bg-primary/20 text-primary border border-primary/25 shadow-lg shadow-primary/10'
                        : 'text-muted-foreground/50'
                    }`}
                  >
                    QUANDO NÃO SAIR
                  </button>
                </div>
              </div>

              {/* Color tokens */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">Montar usando cores:</label>
                <div className="flex flex-wrap gap-2">
                  {colorTokens.map(ct => {
                    const isSelected = config.colors.includes(ct.id);
                    return (
                      <button
                        key={ct.id}
                        onClick={() => toggleColor(ct.id)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? `${ct.border} ring-2 ring-primary/40 scale-110`
                            : 'border-border/30 hover:border-border/60'
                        }`}
                      >
                        {ct.split ? (
                          <div className="w-full h-full rounded-full overflow-hidden flex">
                            <div className={`w-1/2 h-full ${ct.split[0]}`} />
                            <div className={`w-1/2 h-full ${ct.split[1]}`} />
                          </div>
                        ) : ct.inner ? (
                          <div className={`w-full h-full rounded-full ${ct.bg} flex items-center justify-center text-sm`}>
                            {ct.inner}
                          </div>
                        ) : (
                          <div className={`w-7 h-7 rounded-full ${ct.bg}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number tokens */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">Montar usando números:</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 15 }, (_, i) => i).map(n => {
                    const isSelected = config.numbers.includes(n);
                    const nc = numberColors[n];
                    return (
                      <button
                        key={n}
                        onClick={() => toggleNumber(n)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 ${nc.bg} ${nc.text} ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/40 scale-110'
                            : n === 0 ? 'border-border/50' : n <= 7 ? 'border-secondary/40' : 'border-zinc-600'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gales & Victory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">Gales:</label>
                  <div className="flex items-center gap-3 bg-muted/20 border border-border/30 rounded-xl p-1">
                    <button
                      onClick={() => setConfig(c => ({ ...c, gales: Math.max(0, c.gales - 1) }))}
                      className="w-10 h-10 rounded-lg bg-card/60 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center text-xl font-bold text-foreground">{config.gales}</span>
                    <button
                      onClick={() => setConfig(c => ({ ...c, gales: Math.min(10, c.gales + 1) }))}
                      className="w-10 h-10 rounded-lg bg-card/60 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">Vitória em:</label>
                  <div className="relative">
                    <select
                      value={config.victoryTarget}
                      onChange={e => setConfig(c => ({ ...c, victoryTarget: e.target.value as PatternConfig['victoryTarget'] }))}
                      className="w-full appearance-none bg-muted/20 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                    >
                      <option value="reds">🔴 Vermelhos</option>
                      <option value="blacks">⚫ Pretos</option>
                      <option value="whites">⚪ Brancos</option>
                      <option value="any">🎯 Qualquer</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Summary */}
              {(config.colors.length > 0 || config.numbers.length > 0) && (
                <div className="rounded-2xl p-4 border border-primary/15 bg-primary/[0.03]">
                  <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold mb-2">Resumo do padrão</p>
                  <div className="space-y-1 text-xs text-muted-foreground/60">
                    {config.colors.length > 0 && <p>Cores: <span className="text-foreground font-semibold">{config.colors.join(', ')}</span></p>}
                    {config.numbers.length > 0 && <p>Números: <span className="text-foreground font-semibold">{config.numbers.join(', ')}</span></p>}
                    <p>Gales: <span className="text-foreground font-semibold">{config.gales}</span> | Vitória: <span className="text-foreground font-semibold">{config.victoryTarget}</span></p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-2xl border border-border/30 text-muted-foreground text-sm font-semibold hover:bg-muted/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!config.name.trim()}
                  className="flex-1 py-3 rounded-2xl bg-primary/20 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/30 transition-all shadow-lg shadow-primary/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  SALVAR PADRÃO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patterns;
