import { resumirCarrinho } from '../dominio/carrinho'
import { paraCentavos } from '../dominio/dinheiro'
import { avancar, formatarSenha } from '../dominio/pedido'
import type { Carrinho, CotaPaga, Pedido } from '../dominio/tipos'
import type { DadosPagamento, MeioPagamento } from '../pagamento'
import type { Cancelar, PedidoRepositorio } from '../repositorio/PedidoRepositorio'

export type PagamentoCota = {
  nome: string
  valor: number
  meioPagamentoId: string
  dadosPagamento: DadosPagamento
}

export type NovoPedido = {
  cliente: string
  carrinho: Carrinho
  retirada: string
  meioPagamentoId: string
  dadosPagamento: DadosPagamento
  pagamentos?: PagamentoCota[]
}

export type ResultadoPedido = { ok: true; pedido: Pedido } | { ok: false; erro: string }

export const ERRO_SEM_NOME = 'Coloca teu nome pra gente te chamar no balcão.'

type Opcoes = {
  /** Simula o tempo de aprovação do pagamento. */
  processarPagamento?: () => Promise<void>
  agora?: () => number
}

const esperar = (ms: number) => () => new Promise<void>((resolver) => setTimeout(resolver, ms))

function descreverDivisao(divisao: CotaPaga[]): string {
  return `Rachado (${divisao.length}): ` + divisao.map((d) => `${d.nome} (${d.pagamento})`).join(' · ')
}

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
    const { quantidade, total } = resumirCarrinho(novo.carrinho)
    if (quantidade === 0) return 'Seu carrinho está vazio.'
    if (novo.pagamentos?.length) return this.validarDivisao(novo.pagamentos, total)
    return this.validarMeio(novo.meioPagamentoId, novo.dadosPagamento)
  }

  private validarMeio(id: string, dados: DadosPagamento): string | null {
    const meio = this.meio(id)
    return meio ? meio.validar(dados) : 'Meio de pagamento desconhecido.'
  }

  private validarDivisao(cotas: PagamentoCota[], total: number): string | null {
    if (cotas.some((c) => c.valor <= 0)) return 'Cada colega no racha precisa ter valor maior que zero.'
    const soma = cotas.reduce((s, c) => s + paraCentavos(c.valor), 0)
    if (soma !== paraCentavos(total)) return 'A soma das partes não bate com o total do pedido.'
    return this.validarCotasMeio(cotas)
  }

  private validarCotasMeio(cotas: PagamentoCota[]): string | null {
    for (const c of cotas) {
      const erro = this.validarMeio(c.meioPagamentoId, c.dadosPagamento)
      if (erro) return `${c.nome}: ${erro}`
    }
    return null
  }

  private montarPedido(novo: NovoPedido): Pedido {
    const { itens, total } = resumirCarrinho(novo.carrinho)
    const divisao = this.montarDivisao(novo.pagamentos)
    const pagamento = divisao ? descreverDivisao(divisao) : this.descreverMeio(novo.meioPagamentoId, novo.dadosPagamento)
    return {
      senha: formatarSenha(this.repositorio.proximoNumeroSenha()),
      cliente: novo.cliente.trim(),
      itens,
      total,
      pagamento,
      ...(divisao ? { divisao } : {}),
      retirada: novo.retirada,
      status: 'recebido',
      criadoEm: this.agora(),
    }
  }

  private montarDivisao(cotas?: PagamentoCota[]): CotaPaga[] | undefined {
    if (!cotas || cotas.length <= 1) return undefined
    return cotas.map((c) => ({
      nome: c.nome.trim(),
      valor: c.valor,
      pagamento: this.descreverMeio(c.meioPagamentoId, c.dadosPagamento),
    }))
  }

  private descreverMeio(id: string, dados: DadosPagamento): string {
    return this.meio(id)!.descrever(dados)
  }

  private meio(id: string): MeioPagamento | undefined {
    return this.meios.find((m) => m.id === id)
  }
}
