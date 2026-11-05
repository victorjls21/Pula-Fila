export function formatarPreco(valor: number): string {
  return 'R$ ' + valor.toFixed(2).replace('.', ',')
}

export function paraCentavos(valor: number): number {
  return Math.round(valor * 100)
}

export function deCentavos(centavos: number): number {
  return centavos / 100
}

