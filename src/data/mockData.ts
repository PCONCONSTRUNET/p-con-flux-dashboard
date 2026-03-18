// Mock data for the entire application
export interface Pattern {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  parameters: string;
  rules: string;
  createdAt: string;
}

export interface AlertEvent {
  id: string;
  patternId: string;
  patternName: string;
  status: 'detected' | 'analyzing' | 'resolved';
  timestamp: string;
  details: string;
}

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  role: 'client';
  createdAt: string;
}

export const mockPatterns: Pattern[] = [
  { id: '1', name: 'Sequência Alpha-7', description: 'Detecta padrões repetitivos em intervalos regulares', status: 'active', parameters: 'Intervalo: 5min, Threshold: 85%', rules: 'Mínimo 3 ocorrências consecutivas', createdAt: '2026-03-01' },
  { id: '2', name: 'Convergência Beta', description: 'Identifica convergência de múltiplos indicadores', status: 'active', parameters: 'Sensibilidade: Alta, Canais: 4', rules: 'Correlação > 0.92', createdAt: '2026-03-05' },
  { id: '3', name: 'Desvio Gamma-X', description: 'Monitora desvios estatísticos significativos', status: 'inactive', parameters: 'Desvio: 2.5σ, Janela: 30min', rules: 'Z-score > 2.5 por 2+ amostras', createdAt: '2026-03-10' },
  { id: '4', name: 'Fluxo Delta-9', description: 'Rastreia variações de fluxo em tempo real', status: 'active', parameters: 'Taxa: 100ms, Buffer: 50', rules: 'Variação > 15% em 10s', createdAt: '2026-03-12' },
  { id: '5', name: 'Pulso Epsilon', description: 'Detecta pulsos irregulares no sinal analítico', status: 'active', parameters: 'Freq: 200Hz, Amplitude: 0.3', rules: 'Duração > 500ms', createdAt: '2026-03-15' },
];

export const mockAlerts: AlertEvent[] = [
  { id: '1', patternId: '1', patternName: 'Sequência Alpha-7', status: 'detected', timestamp: '2026-03-18T14:32:00', details: 'Padrão detectado no canal principal. 4 ocorrências consecutivas identificadas.' },
  { id: '2', patternId: '2', patternName: 'Convergência Beta', status: 'analyzing', timestamp: '2026-03-18T14:28:00', details: 'Convergência parcial detectada. Aguardando confirmação do 4º indicador.' },
  { id: '3', patternId: '4', patternName: 'Fluxo Delta-9', status: 'detected', timestamp: '2026-03-18T14:15:00', details: 'Variação de 22% detectada em janela de 8 segundos.' },
  { id: '4', patternId: '5', patternName: 'Pulso Epsilon', status: 'resolved', timestamp: '2026-03-18T13:45:00', details: 'Pulso irregular resolvido após normalização do sinal.' },
  { id: '5', patternId: '1', patternName: 'Sequência Alpha-7', status: 'detected', timestamp: '2026-03-18T13:20:00', details: '3 ocorrências detectadas. Intervalo médio: 4.8min.' },
  { id: '6', patternId: '2', patternName: 'Convergência Beta', status: 'resolved', timestamp: '2026-03-18T12:55:00', details: 'Convergência total confirmada. Todos os 4 canais correlacionados.' },
  { id: '7', patternId: '4', patternName: 'Fluxo Delta-9', status: 'detected', timestamp: '2026-03-18T12:30:00', details: 'Pico de variação: 18.3% em 6 segundos.' },
  { id: '8', patternId: '1', patternName: 'Sequência Alpha-7', status: 'analyzing', timestamp: '2026-03-18T11:50:00', details: '2 ocorrências identificadas. Monitorando para a 3ª.' },
];

export const mockUsers: ClientUser[] = [
  { id: '1', name: 'Carlos Silva', email: 'carlos@empresa.com', status: 'active', role: 'client', createdAt: '2026-02-15' },
  { id: '2', name: 'Ana Rodrigues', email: 'ana@empresa.com', status: 'active', role: 'client', createdAt: '2026-02-20' },
  { id: '3', name: 'Bruno Costa', email: 'bruno@startup.io', status: 'inactive', role: 'client', createdAt: '2026-03-01' },
  { id: '4', name: 'Mariana Santos', email: 'mariana@corp.com', status: 'active', role: 'client', createdAt: '2026-03-05' },
];
