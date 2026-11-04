import { useMemo, useState } from 'react'
import { adicionarItem, removerItem, resumirCarrinho, type ResumoCarrinho } from '../dominio/carrinho'
import type { Carrinho } from '../dominio/tipos'

export type CarrinhoHook = {
  itens: Carrinho
  resumo: ResumoCarrinho
  adicionar: (id: string) => void
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
    remover: (id) => setItens((c) => removerItem(c, id)),
    esvaziar: () => setItens({}),
  }
}
