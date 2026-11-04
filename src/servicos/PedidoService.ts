import { resumirCarrinho } from '../dominio/carrinho'
import { avancar, formatarSenha } from '../dominio/pedido'
import type { Carrinho, Pedido } from '../dominio/tipos'
import type { DadosPagamento, MeioPagamento } from '../pagamento'
import type { Cancelar, PedidoRepositorio } from '../repositorio/PedidoRepositorio'

export type NovoPedido = {
  cliente: string
  carrinho: Carrinho
  retirada: string
  meioPagamentoId: string
  dadosPagamento: DadosPagamento
}

export type ResultadoPedido = { ok: true; pedido: Pedido } | { ok: false; erro: string }

export const ERRO_SEM_NOME = 'Coloca teu nome pra gente te chamar no balcão.'

type Opcoes = {
  /** Simula o tempo de aprovação do pagamento. */
  processarPagamento?: () => Promise<void>
  agora?: () => number
}

const esperar = (ms: number) => () => new Promise<void>((resolver) => setTimeout(resolver, ms))

/** Regras do pedido: validar, cobrar, numerar, gravar e andar no fluxo do balcão. */
export class PedidoService {
  private readonly repositorio: PedidoRepositorio
  private readonly meios: MeioPagamento[]
  private readonly processarPagamento: () => Promise<void>
  private readonly agora: () => number

  constructor(repositorio: PedidoRepositorio, meios: MeioPagamento[], opcoes: Opcoes = {}) {
    this.repositorio = repositorio
    this.meios = meios
    this.processarPagamento = opcoes.processarPagamento ?? esperar(1200)
    this.agora = opcoes.agora ?? Date.now
  }

  listar(): Pedido[] {
    return this.repositorio.listar()
  }

  observar(aoMudar: (pedidos: Pedido[]) => void): Cancelar {
    return this.repositorio.observar(aoMudar)
  }

  async finalizarPedido(novo: NovoPedido): Promise<ResultadoPedido> {
    const erro = this.validar(novo)
    if (erro) return { ok: false, erro }
    await this.processarPagamento()
    const pedido = this.montarPedido(novo)
    this.repositorio.adicionar(pedido)
    return { ok: true, pedido }
  }

  avancarStatus(senha: string): void {
    const pedido = this.repositorio.listar().find((p) => p.senha === senha)
    if (pedido) this.repositorio.atualizar(avancar(pedido))
  }

  zerarDia(): void {
    this.repositorio.limpar()
  }

  private validar(novo: NovoPedido): string | null {
    if (!novo.cliente.trim()) return ERRO_SEM_NOME
    if (resumirCarrinho(novo.carrinho).quantidade === 0) return 'Seu carrinho está vazio.'
    const meio = this.meio(novo.meioPagamentoId)
    if (!meio) return 'Meio de pagamento desconhecido.'
    return meio.validar(novo.dadosPagamento)
  }

  private montarPedido(novo: NovoPedido): Pedido {
    const { itens, total } = resumirCarrinho(novo.carrinho)
    return {
      senha: formatarSenha(this.repositorio.proximoNumeroSenha()),
      cliente: novo.cliente.trim(),
      itens,
      total,
      pagamento: this.meio(novo.meioPagamentoId)!.descrever(novo.dadosPagamento),
      retirada: novo.retirada,
      status: 'recebido',
      criadoEm: this.agora(),
    }
  }

  private meio(id: string): MeioPagamento | undefined {
    return this.meios.find((m) => m.id === id)
  }
}
