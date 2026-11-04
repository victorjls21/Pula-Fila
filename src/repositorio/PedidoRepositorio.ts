import type { Pedido } from '../dominio/tipos'

export type Cancelar = () => void

/** Onde os pedidos ficam guardados. Telas e serviços só conhecem esta interface. */
export interface PedidoRepositorio {
  listar(): Pedido[]
  adicionar(pedido: Pedido): void
  /** Substitui o pedido de mesma senha. */
  atualizar(pedido: Pedido): void
  /** Apaga todos os pedidos e reinicia a numeração das senhas. */
  limpar(): void
  /** Reserva e devolve o próximo número de senha (1, 2, 3…). */
  proximoNumeroSenha(): number
  /** Avisa sempre que a lista mudar, inclusive por outra aba. */
  observar(aoMudar: (pedidos: Pedido[]) => void): Cancelar
}

/** Dados deste aparelho: quem é o aluno e qual senha ele está acompanhando. */
export interface SessaoCliente {
  nome(): string
  salvarNome(nome: string): void
  minhaSenha(): string
  salvarMinhaSenha(senha: string): void
}
