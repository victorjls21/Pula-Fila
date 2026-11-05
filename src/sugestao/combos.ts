import type { ItemCardapio, TipoCategoria } from '../dominio/tipos'
import type { Combo, EstrategiaSugestao, Restricoes } from './EstrategiaSugestao'

/** Quanto cada pedido já na fila atrasa o próximo. */
export const MINUTOS_POR_PEDIDO_NA_FILA = 1

/** Os itens saem juntos, então o combo fica pronto quando o mais demorado fica, mais a espera da fila. */
export function estimarMinutos(itens: ItemCardapio[], naFila: number): number {
  return Math.max(...itens.map((i) => i.tempoPreparo)) + naFila * MINUTOS_POR_PEDIDO_NA_FILA
}

export function montarCombo(itens: ItemCardapio[], naFila: number): Combo {
  const centavos = itens.reduce((soma, i) => soma + Math.round(i.preco * 100), 0)
  return { id: itens.map((i) => i.id).join('+'), itens, preco: centavos / 100, minutos: estimarMinutos(itens, naFila) }
}

/** Todo principal + bebida, com e sem sobremesa. */
export function gerarCombos(cardapio: ItemCardapio[], naFila: number): Combo[] {
  const doTipo = (tipo: TipoCategoria) => cardapio.filter((i) => i.tipo === tipo)
  const combos: Combo[] = []
  for (const principal of doTipo('principal')) {
    for (const bebida of doTipo('bebida')) {
      combos.push(montarCombo([principal, bebida], naFila))
      for (const sobremesa of doTipo('sobremesa')) combos.push(montarCombo([principal, bebida, sobremesa], naFila))
    }
  }
  return combos
}

export function cabe(combo: Combo, restricoes: Restricoes): boolean {
  const pessoas = combo.pessoas ?? 1
  return combo.preco <= restricoes.orcamento * pessoas && combo.minutos <= restricoes.minutosDisponiveis
}

export function escalarCombo(combo: Combo, pessoas = 1): Combo {
  if (pessoas <= 1) return combo
  const preco = (Math.round(combo.preco * 100) * pessoas) / 100
  return { ...combo, preco, pessoas }
}

/** Combos que cabem no bolso e no tempo, na ordem da estratégia, sem repetir o prato principal. */
export function sugerirCombos(estrategia: EstrategiaSugestao, restricoes: Restricoes, candidatos: Combo[], limite = 3): Combo[] {
  const ordenados = candidatos.filter((c) => cabe(c, restricoes) && estrategia.aceita(c)).sort((a, b) => estrategia.comparar(a, b))
  const principais = new Set<string>()
  const escolhidos: Combo[] = []
  for (const combo of ordenados) {
    if (escolhidos.length === limite) break
    if (principais.has(combo.itens[0].id)) continue
    principais.add(combo.itens[0].id)
    escolhidos.push(escalarCombo(combo, estrategia.pessoas))
  }
  return escolhidos
}
