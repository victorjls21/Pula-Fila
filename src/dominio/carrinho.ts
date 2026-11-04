import { buscarItem } from './cardapio'
import type { Carrinho, ItemCardapio, ItemPedido } from './tipos'

export type ResumoCarrinho = { itens: ItemPedido[]; total: number; quantidade: number }

export function adicionarItem(carrinho: Carrinho, id: string): Carrinho {
  return { ...carrinho, [id]: (carrinho[id] ?? 0) + 1 }
}

export function removerItem(carrinho: Carrinho, id: string): Carrinho {
  const novo = { ...carrinho }
  if (novo[id] > 1) novo[id] -= 1
  else delete novo[id]
  return novo
}

/** Transforma o carrinho em itens de pedido com preço congelado, e soma total e quantidade. */
export function resumirCarrinho(
  carrinho: Carrinho,
  buscar: (id: string) => ItemCardapio | undefined = buscarItem,
): ResumoCarrinho {
  const itens: ItemPedido[] = []
  for (const [id, qtd] of Object.entries(carrinho)) {
    const item = buscar(id)
    if (item) itens.push({ id: item.id, nome: item.nome, preco: item.preco, qtd })
  }
  const total = itens.reduce((soma, i) => soma + i.preco * i.qtd, 0)
  const quantidade = itens.reduce((soma, i) => soma + i.qtd, 0)
  return { itens, total, quantidade }
}
