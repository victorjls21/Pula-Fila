// Vocabulário do domínio, compartilhado por serviços, repositórios e telas.

export type StatusPedido = 'recebido' | 'preparo' | 'pronto' | 'retirado'

export type ItemCardapio = {
  id: string
  nome: string
  preco: number
  categoria: string
  descricao?: string
}

export type Categoria = {
  nome: string
  emoji: string
  itens: Omit<ItemCardapio, 'categoria'>[]
}

export type Destaque = { id: string; rotulo: string }

export type ItemPedido = { id: string; nome: string; preco: number; qtd: number }

export type Pedido = {
  senha: string
  cliente: string
  itens: ItemPedido[]
  total: number
  pagamento: string
  retirada: string
  status: StatusPedido
  criadoEm: number
}

/** Quantidade escolhida por id de item. */
export type Carrinho = Record<string, number>
