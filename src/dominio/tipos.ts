// Vocabulário do domínio, compartilhado por serviços, repositórios e telas.

export type StatusPedido = 'recebido' | 'preparo' | 'pronto' | 'retirado'

/** Papel da categoria num combo do intervalo. */
export type TipoCategoria = 'principal' | 'bebida' | 'sobremesa'

export type ItemCardapio = {
  id: string
  nome: string
  preco: number
  /** Minutos estimados para o item sair do balcão. */
  tempoPreparo: number
  leve?: boolean
  descricao?: string
  categoria: string
  tipo: TipoCategoria
}

export type Categoria = {
  nome: string
  tipo: TipoCategoria
  emoji: string
  itens: Omit<ItemCardapio, 'categoria' | 'tipo'>[]
}

export type Destaque = { id: string; rotulo: string }

export type ItemPedido = { id: string; nome: string; preco: number; qtd: number }

export type CotaPaga = { nome: string; valor: number; pagamento: string }

export type Pedido = {
  senha: string
  cliente: string
  itens: ItemPedido[]
  total: number
  pagamento: string
  divisao?: CotaPaga[]
  retirada: string
  status: StatusPedido
  criadoEm: number
}

/** Quantidade escolhida por id de item. */
export type Carrinho = Record<string, number>
