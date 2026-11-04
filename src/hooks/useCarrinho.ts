import { useMemo, useState } from 'react'
import { adicionarItem, removerItem, resumirCarrinho, type ResumoCarrinho } from '../dominio/carrinho'
import type { Carrinho } from '../dominio/tipos'

export type CarrinhoHook = {
  itens: Carrinho
  resumo: ResumoCarrinho
  adicionar: (id: string) => void
  adicionarVarios: (ids: string[]) => void
  remover: (id: string) => void
  esvaziar: () => void
}

export function useCarrinho(): CarrinhoHook {
  const [itens, setItens] = useState<Carrinho>({})
  const resumo = useMemo(() => resumirCarrinho(itens), [itens])
  return {
    itens,
    resumo,
    adicionar: (id) => setItens((c) => adicionarItem(c, id)),
    adicionarVarios: (ids) => setItens((c) => ids.reduce(adicionarItem, c)),
    remover: (id) => setItens((c) => removerItem(c, id)),
    esvaziar: () => setItens({}),
  }
}
