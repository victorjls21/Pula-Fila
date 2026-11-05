import type { ItemCardapio } from '../dominio/tipos'

export type Combo = {
  id: string
  /** Sempre na ordem principal, bebida, sobremesa (opcional). */
  itens: ItemCardapio[]
  preco: number
  /** Minutos estimados até ficar pronto, já contando a fila atual. */
  minutos: number
  /** Quantas pessoas dividem o combo (padrão: 1). */
  pessoas?: number
}

export type Restricoes = {
  orcamento: number
  minutosDisponiveis: number
}

// Strategy: cada regra de sugestão decide quais combos aceita e em que ordem aparecem.
// Nova regra = nova classe registrada em sugestao/index.ts; geração, filtros de orçamento/tempo e tela não mudam.
export interface EstrategiaSugestao {
  readonly id: string
  readonly nome: string
  readonly descricao: string
  /** Quantas pessoas dividem o combo sugerido (padrão: 1). */
  readonly pessoas?: number
  aceita(combo: Combo): boolean
  /** Negativo quando `a` deve aparecer antes de `b`. */
  comparar(a: Combo, b: Combo): number
}
