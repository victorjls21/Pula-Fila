import type { EstrategiaDivisao } from './EstrategiaDivisao'
import { desmembrarItens, DivisaoIgualitaria, DivisaoPorItem, nomeParticipante } from './estrategias'

export type { CotaDivisao, DadosDivisao, EstrategiaDivisao, ItemUnitario } from './EstrategiaDivisao'
export { desmembrarItens, DivisaoIgualitaria, DivisaoPorItem, nomeParticipante }

/** Modos de divisão disponíveis na tela "Seu pedido". */
export const estrategiasDivisao: EstrategiaDivisao[] = [new DivisaoIgualitaria(), new DivisaoPorItem()]

