import { useState } from 'react'
import { resumirCarrinho } from '../dominio/carrinho'
import { gerarHorariosRetirada, RETIRADA_IMEDIATA } from '../dominio/horarios'
import type { Carrinho, ItemPedido, Pedido } from '../dominio/tipos'
import type { DadosPagamento, MeioPagamento } from '../pagamento'
import { ERRO_SEM_NOME } from '../servicos/PedidoService'
import { useServicos } from './contexto'
import { useDivisao, type DivisaoHook } from './useDivisao'

export type CheckoutHook = {
  nome: string
  setNome: (nome: string) => void
  horarios: string[]
  atualizarHorarios: () => void
  retirada: string
  setRetirada: (retirada: string) => void
  meios: MeioPagamento[]
  meio: MeioPagamento
  setMeioId: (id: string) => void
  dados: DadosPagamento
  setDado: (campo: string, valor: string) => void
  erro: string
  limparErro: () => void
  processando: boolean
  divisao: DivisaoHook
  conferirNome: (itens?: ItemPedido[]) => boolean
  confirmarColegaAtual: (totalPessoas: number) => boolean
  pagar: (carrinho: Carrinho) => Promise<Pedido | null>
}

/** Estado dos formulários de carrinho, racha e pagamento. A regra fica no PedidoService e em divisao/. */
export function useCheckout(): CheckoutHook {
  const { pedidos, sessao, meiosPagamento } = useServicos()
  const divisao = useDivisao()
  const [nome, setNome] = useState(() => sessao.nome())
  const [horarios, setHorarios] = useState(() => gerarHorariosRetirada(new Date()))
  const [retirada, setRetirada] = useState(RETIRADA_IMEDIATA)
  const [meioId, setMeioId] = useState(meiosPagamento[0].id)
  const [dados, setDados] = useState<DadosPagamento>({})
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)

  const idAtivo = divisao.ativa ? divisao.escolhaAtual.meioId : meioId
  const meio = meiosPagamento.find((m) => m.id === idAtivo) ?? meiosPagamento[0]
  const dadosAtivos = divisao.ativa ? divisao.escolhaAtual.dados : dados

  function atualizarHorarios() {
    const novos = gerarHorariosRetirada(new Date())
    setHorarios(novos)
    if (!novos.includes(retirada)) setRetirada(RETIRADA_IMEDIATA)
  }

  function alterarNome(novo: string) {
    setNome(novo)
    divisao.sincronizarPrimeiroNome(novo)
  }

  function conferirNome(itens: ItemPedido[] = []): boolean {
    if (!nome.trim()) {
      setErro(ERRO_SEM_NOME)
      return false
    }
    if (divisao.ativa && divisao.cotasDe(itens, nome).some((c) => c.valor <= 0)) {
      setErro('Cada colega no racha precisa ter pelo menos um item marcado.')
      return false
    }
    setErro('')
    divisao.selecionarPagador(0)
    return true
  }

  function confirmarColegaAtual(totalPessoas: number): boolean {
    const falha = divisao.confirmarPagadorAtual(meiosPagamento, totalPessoas)
    setErro(falha ?? '')
    return !falha
  }

  function montarPagamentosSeRachado(carrinho: Carrinho) {
    if (!divisao.ativa) return undefined
    const cotas = divisao.cotasDe(resumirCarrinho(carrinho).itens, nome)
    return divisao.montarPagamentos(cotas)
  }

  async function pagar(carrinho: Carrinho): Promise<Pedido | null> {
    setErro('')
    setProcessando(true)
    const resultado = await pedidos.finalizarPedido({
      cliente: nome,
      carrinho,
      retirada,
      meioPagamentoId: meio.id,
      dadosPagamento: dadosAtivos,
      pagamentos: montarPagamentosSeRachado(carrinho),
    })
    setProcessando(false)
    if (!resultado.ok) {
      setErro(resultado.erro)
      return null
    }
    sessao.salvarNome(resultado.pedido.cliente)
    setDados({})
    divisao.resetar()
    return resultado.pedido
  }

  return {
    nome,
    setNome: alterarNome,
    horarios,
    atualizarHorarios,
    retirada,
    setRetirada,
    meios: meiosPagamento,
    meio,
    setMeioId: (id) => (divisao.ativa ? divisao.setMeioAtual(id) : setMeioId(id)),
    dados: dadosAtivos,
    setDado: (campo, valor) => (divisao.ativa ? divisao.setDadoAtual(campo, valor) : setDados((d) => ({ ...d, [campo]: valor }))),
    erro,
    limparErro: () => setErro(''),
    processando,
    divisao,
    conferirNome,
    confirmarColegaAtual,
    pagar,
  }
}
