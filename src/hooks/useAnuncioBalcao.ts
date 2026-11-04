import { useEffect, useRef, useState } from 'react'
import type { Pedido } from '../dominio/tipos'
import { novosProntos, senhasProntas, textoAnuncio } from '../voz/anuncio'
import { useServicos } from './contexto'

/**
 * Anuncia em voz alta cada pedido que fica pronto, inclusive quando outro aparelho marca.
 * Os pedidos que já estavam prontos ao abrir o balcão não são anunciados.
 */
export function useAnuncioBalcao(pedidos: Pedido[]) {
  const { anunciador } = useServicos()
  const [vozLigada, setVozLigada] = useState(true)
  const anunciadas = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (anunciadas.current && vozLigada) {
      for (const pedido of novosProntos(anunciadas.current, pedidos)) anunciador.anunciar(textoAnuncio(pedido))
    }
    // Guarda só as senhas prontas agora: depois de "Zerar dia", a A-001 nova volta a ser anunciada.
    anunciadas.current = senhasProntas(pedidos)
  }, [pedidos, vozLigada, anunciador])

  return {
    disponivel: anunciador.disponivel,
    vozLigada,
    alternarVoz: () => setVozLigada((ligada) => !ligada),
    chamarDeNovo: (pedido: Pedido) => anunciador.anunciar(textoAnuncio(pedido)),
  }
}
