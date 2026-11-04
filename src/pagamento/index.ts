import { Cartao } from './Cartao'
import type { MeioPagamento } from './MeioPagamento'
import { Pix } from './Pix'

export type { CampoPagamento, DadosPagamento, MeioPagamento } from './MeioPagamento'

/** Meios aceitos, na ordem em que aparecem na tela. */
export const meiosPagamento: MeioPagamento[] = [new Pix(), new Cartao()]
