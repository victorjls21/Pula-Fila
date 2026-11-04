import { useState } from 'react'
import { gerarHorariosRetirada, RETIRADA_IMEDIATA } from '../dominio/horarios'
import type { Carrinho, Pedido } from '../dominio/tipos'
import type { DadosPagamento, MeioPagamento } from '../pagamento'
import { ERRO_SEM_NOME } from '../servicos/PedidoService'
import { useServicos } from './contexto'

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
  processando: boolean
  conferirNome: () => boolean
  pagar: (carrinho: Carrinho) => Promise<Pedido | null>
}

/** Estado dos formulários de carrinho e pagamento. A regra fica no PedidoService. */
export function useCheckout(): CheckoutHook {
  const { pedidos, sessao, meiosPagamento } = useServicos()
  const [nome, setNome] = useState(() => sessao.nome())
  const [horarios, setHorarios] = useState(() => gerarHorariosRetirada(new Date()))
  const [retirada, setRetirada] = useState(RETIRADA_IMEDIATA)
  const [meioId, setMeioId] = useState(meiosPagamento[0].id)
  const [dados, setDados] = useState<DadosPagamento>({})
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)

  const meio = meiosPagamento.find((m) => m.id === meioId) ?? meiosPagamento[0]

  function atualizarHorarios() {
    const novos = gerarHorariosRetirada(new Date())
    setHorarios(novos)
    // Um horário que já passou some da lista; volta para "assim que ficar pronto".
    if (!novos.includes(retirada)) setRetirada(RETIRADA_IMEDIATA)
  }

  function conferirNome(): boolean {
    setErro(nome.trim() ? '' : ERRO_SEM_NOME)
    return nome.trim() !== ''
  }

  async function pagar(carrinho: Carrinho): Promise<Pedido | null> {
    setErro('')
    setProcessando(true)
    const resultado = await pedidos.finalizarPedido({
      cliente: nome,
      carrinho,
      retirada,
      meioPagamentoId: meio.id,
      dadosPagamento: dados,
    })
    setProcessando(false)
    if (!resultado.ok) {
      setErro(resultado.erro)
      return null
    }
    sessao.salvarNome(resultado.pedido.cliente)
    setDados({})
    return resultado.pedido
  }

  return {
    nome,
    setNome,
    horarios,
    atualizarHorarios,
    retirada,
    setRetirada,
    meios: meiosPagamento,
    meio,
    setMeioId,
    dados,
    setDado: (campo, valor) => setDados((d) => ({ ...d, [campo]: valor })),
    erro,
    processando,
    conferirNome,
    pagar,
  }
}
