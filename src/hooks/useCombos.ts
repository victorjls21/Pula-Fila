import { useMemo, useState } from 'react'
import { todosItens } from '../dominio/cardapio'
import { gerarCombos, sugerirCombos, type Combo, type EstrategiaSugestao } from '../sugestao'
import { useServicos } from './contexto'

export type CombosHook = {
  orcamento: number
  setOrcamento: (valor: number) => void
  minutos: number
  setMinutos: (valor: number) => void
  estrategias: EstrategiaSugestao[]
  estrategia: EstrategiaSugestao
  setEstrategiaId: (id: string) => void
  sugestoes: Combo[]
}

/** Filtros do "Monte seu combo" e as sugestões da estratégia escolhida, recalculadas com a fila atual. */
export function useCombos(naFila: number): CombosHook {
  const { estrategiasSugestao } = useServicos()
  const [orcamento, setOrcamento] = useState(20)
  const [minutos, setMinutos] = useState(10)
  const [estrategiaId, setEstrategiaId] = useState(estrategiasSugestao[0].id)
  const estrategia = estrategiasSugestao.find((e) => e.id === estrategiaId) ?? estrategiasSugestao[0]

  function escolherEstrategia(id: string) {
    setEstrategiaId(id)
    const nova = estrategiasSugestao.find((e) => e.id === id)
    if ((nova?.pessoas ?? 1) > 1) setOrcamento(30)
  }

  const candidatos = useMemo(() => gerarCombos(todosItens, naFila), [naFila])
  const sugestoes = useMemo(
    () => sugerirCombos(estrategia, { orcamento, minutosDisponiveis: minutos }, candidatos),
    [estrategia, orcamento, minutos, candidatos],
  )

  return {
    orcamento,
    setOrcamento,
    minutos,
    setMinutos,
    estrategias: estrategiasSugestao,
    estrategia,
    setEstrategiaId: escolherEstrategia,
    sugestoes,
  }
}
