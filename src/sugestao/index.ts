import type { EstrategiaSugestao } from './EstrategiaSugestao'
import { DividaComAmigos, Leve, MaisEmConta, MaisRapido, MataFome } from './estrategias'

export type { Combo, EstrategiaSugestao, Restricoes } from './EstrategiaSugestao'
export { gerarCombos, sugerirCombos } from './combos'

/** Regras de sugestão disponíveis, na ordem em que aparecem na tela. */
export const estrategiasSugestao: EstrategiaSugestao[] = [
  new MaisEmConta(),
  new MaisRapido(),
  new MataFome(),
  new Leve(),
  new DividaComAmigos(),
]

export const ORCAMENTOS = [15, 20, 25, 30]
export const TEMPOS_DISPONIVEIS = [5, 10, 15]
