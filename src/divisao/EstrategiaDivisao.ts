import type { ItemPedido } from '../dominio/tipos'

export type ItemUnitario = {
  chave: string
  id: string
  rotulo: string
  preco: number
}

export type CotaDivisao = {
  nome: string
  valor: number
  itens: string[]
}

export type DadosDivisao = {
  participantes: string[]
  /** Mapa de `chave` da unidade do item para o índice do participante (0..N-1). */
  donoPorUnidade: Record<string, number>
}

// Strategy: cada modo de rachar calcula a cota de cada colega a partir dos itens do pedido.
// Novo modo de divisão = nova classe registrada em divisao/index.ts, sem alterar serviço nem telas.
export interface EstrategiaDivisao {
  readonly id: string
  readonly nome: string
  readonly descricao: string
  readonly exigeEscolhaPorItem?: boolean
  calcular(itens: ItemPedido[], dados: DadosDivisao): CotaDivisao[]
}

