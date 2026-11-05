import { estrategiasDivisao, type EstrategiaDivisao } from '../divisao'
import { meiosPagamento, type MeioPagamento } from '../pagamento'
import { LocalStoragePedidoRepositorio, LocalStorageSessaoCliente } from '../repositorio/LocalStoragePedidoRepositorio'
import type { PedidoRepositorio, SessaoCliente } from '../repositorio/PedidoRepositorio'
import { estrategiasSugestao, type EstrategiaSugestao } from '../sugestao'
import { VozDoNavegador, type Anunciador } from '../voz/Anunciador'
import { PedidoService } from './PedidoService'

export type Servicos = {
  pedidos: PedidoService
  sessao: SessaoCliente
  meiosPagamento: MeioPagamento[]
  estrategiasSugestao: EstrategiaSugestao[]
  estrategiasDivisao: EstrategiaDivisao[]
  anunciador: Anunciador
}

/** Raiz de composição: o único lugar que escolhe as implementações concretas (armazenamento, voz). */
export function criarServicos(
  repositorio: PedidoRepositorio = new LocalStoragePedidoRepositorio(window.localStorage),
  sessao: SessaoCliente = new LocalStorageSessaoCliente(window.localStorage),
  anunciador: Anunciador = new VozDoNavegador(),
): Servicos {
  return {
    pedidos: new PedidoService(repositorio, meiosPagamento),
    sessao,
    meiosPagamento,
    estrategiasSugestao,
    estrategiasDivisao,
    anunciador,
  }
}
