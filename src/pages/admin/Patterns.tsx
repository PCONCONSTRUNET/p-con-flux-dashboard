import { useState } from 'react';
import { mockPatterns, Pattern } from '@/data/mockData';
import { Plus, Search, Edit, Power, X } from 'lucide-react';

const Patterns = () => {
  const [patterns, setPatterns] = useState<Pattern[]>(mockPatterns);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', parameters: '', rules: '', status: 'active' as 'active' | 'inactive' });

  const filtered = patterns.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setForm({ name: '', description: '', parameters: '', rules: '', status: 'active' });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: Pattern) => {
    setForm({ name: p.name, description: p.description, parameters: p.parameters, rules: p.rules, status: p.status });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      setPatterns(prev => prev.map(p => p.id === editingId ? { ...p, ...form } : p));
    } else {
      setPatterns(prev => [...prev, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0] }]);
    }
    setShowForm(false);
  };

  const toggleStatus = (id: string) => {
    setPatterns(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Padrões Analíticos</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure e gerencie os padrões de detecção</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md font-display text-xs tracking-wider hover:opacity-90 active:scale-[0.98] transition-all glow-primary">
          <Plus size={16} />
          <span className="hidden sm:inline">NOVO PADRÃO</span>
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar padrões..."
          className="w-full bg-muted border border-border rounded-md pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <div className="card-glass rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-display text-muted-foreground tracking-wider px-4 py-3">NOME</th>
                <th className="text-left text-xs font-display text-muted-foreground tracking-wider px-4 py-3">DESCRIÇÃO</th>
                <th className="text-left text-xs font-display text-muted-foreground tracking-wider px-4 py-3">STATUS</th>
                <th className="text-right text-xs font-display text-muted-foreground tracking-wider px-4 py-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.description}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-display tracking-wider px-2 py-1 rounded ${p.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {p.status === 'active' ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Edit size={14} /></button>
                      <button onClick={() => toggleStatus(p.id)} className={`p-1.5 rounded hover:bg-muted transition-colors ${p.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`}><Power size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="card-glass rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold text-sm text-foreground">{p.name}</span>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
              </div>
              <span className={`text-[10px] font-display tracking-wider px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {p.status === 'active' ? 'ATIVO' : 'INATIVO'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => openEdit(p)} className="flex-1 py-2 rounded-md bg-muted text-foreground text-xs hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"><Edit size={12} /> Editar</button>
              <button onClick={() => toggleStatus(p.id)} className={`flex-1 py-2 rounded-md text-xs transition-colors flex items-center justify-center gap-1 ${p.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Power size={12} /> {p.status === 'active' ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg card-glass rounded-lg p-6 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">{editingId ? 'Editar Padrão' : 'Novo Padrão'}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Nome</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-md px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full bg-muted border border-border rounded-md px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Parâmetros</label>
                <input type="text" value={form.parameters} onChange={e => setForm(f => ({ ...f, parameters: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-md px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Regras Condicionais</label>
                <input type="text" value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-md px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full bg-muted border border-border rounded-md px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <button onClick={handleSave} className="w-full py-3 rounded-md bg-primary text-primary-foreground font-display text-sm tracking-wider hover:opacity-90 active:scale-[0.98] transition-all glow-primary">
                SALVAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patterns;
