import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Power, X, Minus, Layers, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ColorToken = 'black' | 'red' | 'white';

interface PatternRow {
  id: string;
  name: string;
  description: string;
  status: string;
  mode: string;
  colors: string[];
  numbers: number[];
  gales: number;
  victory_target: string;
  created_at: string;
  updated_at: string;
}

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

const colorTokens: { id: ColorToken; border: string; bg: string }[] = [
  { id: 'black', border: 'border-zinc-500', bg: 'bg-zinc-900' },
  { id: 'red', border: 'border-secondary', bg: 'bg-secondary' },
  { id: 'white', border: 'border-border', bg: 'bg-white' },
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
  const [patterns, setPatterns] = useState<PatternRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [config, setConfig] = useState<PatternConfig>({ ...defaultConfig });
  const [saving, setSaving] = useState(false);

  const fetchPatterns = useCallback(async () => {
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching patterns:', error);
      toast.error('Erro ao carregar padrões');
    } else {
      setPatterns((data as PatternRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPatterns();

    // Realtime subscription
    const channel = supabase
      .channel('patterns-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patterns' }, () => {
        fetchPatterns();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPatterns]);

  const filtered = patterns.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setConfig({ ...defaultConfig });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: PatternRow) => {
    setConfig({
      name: p.name,
      description: p.description,
      status: p.status as 'active' | 'inactive',
      mode: (p.mode || 'when_exit') as PatternConfig['mode'],
      colors: (p.colors || []) as ColorToken[],
      numbers: p.numbers || [],
      gales: p.gales ?? 2,
      victoryTarget: (p.victory_target || 'reds') as PatternConfig['victoryTarget'],
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!config.name.trim()) return;
    setSaving(true);

    const payload = {
      name: config.name.trim(),
      description: config.description.trim(),
      status: config.status,
      mode: config.mode,
      colors: config.colors,
      numbers: config.numbers,
      gales: config.gales,
      victory_target: config.victoryTarget,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from('patterns').update(payload).eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar padrão'); console.error(error); }
      else toast.success('Padrão atualizado!');
    } else {
      const { error } = await supabase.from('patterns').insert(payload);
      if (error) { toast.error('Erro ao criar padrão'); console.error(error); }
      else toast.success('Padrão criado!');
    }

    setSaving(false);
    setShowForm(false);
  };

  const addColor = (c: ColorToken) => {
    setConfig(prev => ({ ...prev, colors: [...prev.colors, c] }));
  };

  const removeColorAt = (index: number) => {
    setConfig(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }));
  };

  const addNumber = (n: number) => {
    setConfig(prev => ({ ...prev, numbers: [...prev.numbers, n] }));
  };

  const removeNumberAt = (index: number) => {
    setConfig(prev => ({ ...prev, numbers: prev.numbers.filter((_, i) => i !== index) }));
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('patterns').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Erro ao alterar status');
    else toast.success(newStatus === 'active' ? 'Padrão ativado!' : 'Padrão desativado!');
  };

  const deletePattern = async (id: string) => {
    const { error } = await supabase.from('patterns').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir padrão');
    else toast.success('Padrão excluído!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

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

            {/* Info tags */}
            {(p.colors.length > 0 || p.numbers.length > 0) && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {p.colors.length > 0 && (
                  <div className="flex items-center gap-1">
                    {p.colors.map((c, i) => {
                      const ct = colorTokens.find(t => t.id === c);
                      return ct ? <div key={i} className={`w-4 h-4 rounded-full ${ct.bg} border ${ct.border}`} /> : null;
                    })}
                  </div>
                )}
                {p.numbers.length > 0 && (
                  <span className="text-[10px] text-muted-foreground/40">Nº: {p.numbers.join(', ')}</span>
                )}
                <span className="text-[10px] text-muted-foreground/30">|</span>
                <span className="text-[10px] text-muted-foreground/40">Gales: {p.gales}</span>
                <span className="text-[10px] text-muted-foreground/30">|</span>
                <span className="text-[10px] text-muted-foreground/40">Vitória: {p.victory_target}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/10">
              <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/40 border border-border/20 text-xs text-muted-foreground hover:text-foreground hover:border-border/40 transition-all">
                <Edit size={12} /> Editar
              </button>
              <button onClick={() => toggleStatus(p.id, p.status)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${p.status === 'active' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-card/40 border-border/20 text-muted-foreground hover:text-foreground'}`}>
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
                  <input type="text" value={config.name} onChange={e => setConfig(c => ({ ...c, name: e.target.value }))} placeholder="Ex: Sequência Alpha-7" maxLength={50}
                    className="w-full bg-muted/20 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1.5">Descrição</label>
                  <input type="text" value={config.description} onChange={e => setConfig(c => ({ ...c, description: e.target.value }))} placeholder="Descreva o padrão" maxLength={100}
                    className="w-full bg-muted/20 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
              </div>

              {/* Color tokens */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">Montar usando cores:</label>
                <div className="flex flex-wrap gap-2">
                  {colorTokens.map(ct => (
                    <button key={ct.id} onClick={() => addColor(ct.id)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 border-border/30 hover:border-border/60`}>
                      <div className={`w-7 h-7 rounded-full ${ct.bg}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Number tokens */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">Montar usando números:</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 15 }, (_, i) => i).map(n => {
                    const nc = numberColors[n];
                    return (
                      <button key={n} onClick={() => addNumber(n)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 ${nc.bg} ${nc.text} ${n === 0 ? 'border-border/50' : n <= 7 ? 'border-secondary/40' : 'border-zinc-600'}`}>
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
                    <button onClick={() => setConfig(c => ({ ...c, gales: Math.max(0, c.gales - 1) }))}
                      className="w-10 h-10 rounded-lg bg-card/60 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all">
                      <Minus size={16} />
                    </button>
                    <span className="flex-1 text-center text-xl font-bold text-foreground">{config.gales}</span>
                    <button onClick={() => setConfig(c => ({ ...c, gales: Math.min(10, c.gales + 1) }))}
                      className="w-10 h-10 rounded-lg bg-card/60 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-2">Vitória em:</label>
                  <div className="relative">
                    <select value={config.victoryTarget} onChange={e => setConfig(c => ({ ...c, victoryTarget: e.target.value as PatternConfig['victoryTarget'] }))}
                      className="w-full appearance-none bg-muted/20 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer">
                      <option value="reds">🔴 Vermelhos</option>
                      <option value="blacks">⚫ Pretos</option>
                      <option value="whites">⚪ Brancos</option>
                      <option value="blacks-whites">⚫⚪ Preto + Branco</option>
                      <option value="reds-whites">🔴⚪ Vermelho + Branco</option>
                      <option value="any">🎯 Qualquer</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Summary */}
              {(config.colors.length > 0 || config.numbers.length > 0) && (
                <div className="rounded-2xl p-4 border border-primary/15 bg-primary/[0.03]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold">Sequência montada</p>
                    <button onClick={() => setConfig(c => ({ ...c, colors: [], numbers: [] }))} className="text-[10px] text-secondary/60 hover:text-secondary transition-all">Limpar tudo</button>
                  </div>
                  {config.colors.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-muted-foreground/40 mb-1.5">Cores:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {config.colors.map((c, i) => {
                          const ct = colorTokens.find(t => t.id === c);
                          if (!ct) return null;
                          return (
                            <div key={i} className="relative group">
                              <div className={`w-8 h-8 rounded-full border ${ct.border} flex items-center justify-center overflow-hidden`}>
                                <div className={`w-6 h-6 rounded-full ${ct.bg}`} />
                              </div>
                              <button onClick={() => removeColorAt(i)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {config.numbers.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-muted-foreground/40 mb-1.5">Números:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {config.numbers.map((n, i) => {
                          const nc = numberColors[n];
                          return (
                            <div key={i} className="relative group">
                              <div className={`w-8 h-8 rounded-full ${nc.bg} ${nc.text} flex items-center justify-center text-[11px] font-bold border border-border/20`}>{n}</div>
                              <button onClick={() => removeNumberAt(i)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/50">Gales: <span className="text-foreground font-semibold">{config.gales}</span> | Vitória: <span className="text-foreground font-semibold">{config.victoryTarget}</span></p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-border/30 text-muted-foreground text-sm font-semibold hover:bg-muted/20 transition-all">Cancelar</button>
                <button onClick={handleSave} disabled={!config.name.trim() || saving}
                  className="flex-1 py-3 rounded-2xl bg-primary/20 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/30 transition-all shadow-lg shadow-primary/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
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
