import { meiosPagamento, type MeioPagamento } from '../pagamento'
import { LocalStoragePedidoRepositorio, LocalStorageSessaoCliente } from '../repositorio/LocalStoragePedidoRepositorio'
import type { PedidoRepositorio, SessaoCliente } from '../repositorio/PedidoRepositorio'
import { PedidoService } from './PedidoService'

export type Servicos = {
  pedidos: PedidoService
  sessao: SessaoCliente
  meiosPagamento: MeioPagamento[]
}

/** Raiz de composição: o único lugar que escolhe a implementação concreta do armazenamento. */
export function criarServicos(
  repositorio: PedidoRepositorio = new LocalStoragePedidoRepositorio(window.localStorage),
  sessao: SessaoCliente = new LocalStorageSessaoCliente(window.localStorage),
): Servicos {
  return { pedidos: new PedidoService(repositorio, meiosPagamento), sessao, meiosPagamento }
}
