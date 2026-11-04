// Efeitos no navegador, fora dos componentes.

export const ROTA_BALCAO = '#/balcao'

export function lerHash(): string {
  return window.location.hash
}

export function definirHash(hash: string): void {
  window.location.hash = hash
}

export function rolarAte(id: string): void {
  setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50)
}

export function definirTitulo(titulo: string): void {
  document.title = titulo
}

export function vibrar(padrao: number[]): void {
  if (navigator.vibrate) navigator.vibrate(padrao)
}

export function confirmar(mensagem: string): boolean {
  return window.confirm(mensagem)
}
