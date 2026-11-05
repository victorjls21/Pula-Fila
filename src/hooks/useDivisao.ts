import { useState } from 'react'
import { desmembrarItens, nomeParticipante, type CotaDivisao, type EstrategiaDivisao, type ItemUnitario } from '../divisao'
import type { ItemPedido } from '../dominio/tipos'
import type { DadosPagamento, MeioPagamento } from '../pagamento'
import type { PagamentoCota } from '../servicos/PedidoService'
import { useServicos } from './contexto'

export type EscolhaPagamentoColega = {
  meioId: string
  dados: DadosPagamento
  confirmado: boolean
}

export type DivisaoHook = {
  ativa: boolean
  alternar: (ativa: boolean, nomePrincipal: string) => void
  estrategias: EstrategiaDivisao[]
  estrategia: EstrategiaDivisao
  setEstrategiaId: (id: string) => void
  participantes: string[]
  sincronizarPrimeiroNome: (nome: string) => void
  renomear: (indice: number, nome: string) => void
  adicionarColega: () => void
  removerColega: (indice: number) => void
  donoPorUnidade: Record<string, number>
  atribuirUnidade: (chave: string, indice: number) => void
  unidadesDe: (itens: ItemPedido[]) => ItemUnitario[]
  cotasDe: (itens: ItemPedido[], nomePrincipal: string) => CotaDivisao[]
  indicePagador: number
  selecionarPagador: (indice: number) => void
  escolhaAtual: EscolhaPagamentoColega
  escolhas: Record<number, EscolhaPagamentoColega>
  setMeioAtual: (meioId: string) => void
  setDadoAtual: (campo: string, valor: string) => void
  confirmarPagadorAtual: (meios: MeioPagamento[], totalPessoas: number) => string | null
  montarPagamentos: (cotas: CotaDivisao[]) => PagamentoCota[]
  resetar: () => void
}

const MAX_COLEGAS = 6

export function useDivisao(): DivisaoHook {
  const { estrategiasDivisao, meiosPagamento } = useServicos()
  const meioPadrao = meiosPagamento[0].id
  const [ativa, setAtiva] = useState(false)
  const [estrategiaId, setEstrategiaId] = useState(estrategiasDivisao[0].id)
  const [participantes, setParticipantes] = useState<string[]>(['', 'Colega 2'])
  const [donoPorUnidade, setDonoPorUnidade] = useState<Record<string, number>>({})
  const [indicePagador, setIndicePagador] = useState(0)
  const [escolhas, setEscolhas] = useState<Record<number, EscolhaPagamentoColega>>({})

  const estrategia = estrategiasDivisao.find((e) => e.id === estrategiaId) ?? estrategiasDivisao[0]
  const escolhaAtual = escolhas[indicePagador] ?? { meioId: meioPadrao, dados: {}, confirmado: false }

  function atualizarEscolha(indice: number, parcial: Partial<EscolhaPagamentoColega>) {
    setEscolhas((ant) => {
      const atual = ant[indice] ?? { meioId: meioPadrao, dados: {}, confirmado: false }
      return { ...ant, [indice]: { ...atual, ...parcial } }
    })
  }

  function alternar(novaAtiva: boolean, nomePrincipal: string) {
    setAtiva(novaAtiva)
    setIndicePagador(0)
    if (novaAtiva) setParticipantes((p) => [nomePrincipal || p[0], ...p.slice(1)])
  }

  function adicionarColega() {
    if (participantes.length >= MAX_COLEGAS) return
    setParticipantes((p) => [...p, `Colega ${p.length + 1}`])
  }

  function removerColega(indice: number) {
    if (participantes.length <= 2) return
    setParticipantes((p) => p.filter((_, i) => i !== indice))
    setIndicePagador(0)
    setEscolhas({})
  }

  function cotasDe(itens: ItemPedido[], nomePrincipal: string): CotaDivisao[] {
    const nomes = participantes.map((n, i) => (i === 0 ? nomePrincipal.trim() || n.trim() || 'Você' : nomeParticipante(n, i)))
    return estrategia.calcular(itens, { participantes: nomes, donoPorUnidade })
  }

  function confirmarPagadorAtual(meios: MeioPagamento[], totalPessoas: number): string | null {
    const meio = meios.find((m) => m.id === escolhaAtual.meioId) ?? meios[0]
    const erro = meio.validar(escolhaAtual.dados)
    if (erro) return erro
    atualizarEscolha(indicePagador, { confirmado: true })
    if (indicePagador < totalPessoas - 1) setIndicePagador(indicePagador + 1)
    return null
  }

  function montarPagamentos(cotas: CotaDivisao[]): PagamentoCota[] {
    return cotas.map((cota, i) => {
      const esc = escolhas[i] ?? { meioId: meioPadrao, dados: {} }
      return { nome: cota.nome, valor: cota.valor, meioPagamentoId: esc.meioId, dadosPagamento: esc.dados }
    })
  }

  function resetar() {
    setAtiva(false)
    setIndicePagador(0)
    setEscolhas({})
    setDonoPorUnidade({})
  }

  return {
    ativa,
    alternar,
    estrategias: estrategiasDivisao,
    estrategia,
    setEstrategiaId,
    participantes,
    sincronizarPrimeiroNome: (nome) => setParticipantes((p) => [nome, ...p.slice(1)]),
    renomear: (indice, nome) => setParticipantes((p) => p.map((atual, i) => (i === indice ? nome : atual))),
    adicionarColega,
    removerColega,
    donoPorUnidade,
    atribuirUnidade: (chave, indice) => setDonoPorUnidade((d) => ({ ...d, [chave]: indice })),
    unidadesDe: desmembrarItens,
    cotasDe,
    indicePagador,
    selecionarPagador: setIndicePagador,
    escolhaAtual,
    escolhas,
    setMeioAtual: (meioId) => atualizarEscolha(indicePagador, { meioId, confirmado: false }),
    setDadoAtual: (campo, valor) => atualizarEscolha(indicePagador, { dados: { ...escolhaAtual.dados, [campo]: valor }, confirmado: false }),
    confirmarPagadorAtual,
    montarPagamentos,
    resetar,
  }
}

