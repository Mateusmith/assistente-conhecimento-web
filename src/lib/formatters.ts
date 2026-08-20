const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const formatadorNumero = new Intl.NumberFormat('pt-BR');

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

export function formatarData(valor: string | null | undefined): string {
  if (!valor) return 'Ainda nao disponivel';
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? 'Data invalida' : formatadorData.format(data);
}

export function formatarNumero(valor: number): string {
  return formatadorNumero.format(valor);
}

export function formatarMoedaUsd(valor: number): string {
  return formatadorMoeda.format(valor);
}

export function formatarPercentual(valor: number, fracao = true): string {
  const percentual = fracao ? valor * 100 : valor;
  return `${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

export function formatarBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
  const indice = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unidades.length - 1);
  const valor = bytes / 1024 ** indice;
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: indice === 0 ? 0 : 1 })} ${unidades[indice]}`;
}

export function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('') || 'U';
}

export function limitarTexto(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  return `${texto.slice(0, Math.max(0, limite - 1)).trimEnd()}…`;
}
