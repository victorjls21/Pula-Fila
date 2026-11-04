// Strategy: cada meio de pagamento sabe validar e descrever os próprios dados.
// Novo meio = nova classe registrada em pagamento/index.ts, sem tocar em serviço nem tela.

export type DadosPagamento = Record<string, string>

export type CampoPagamento = {
  nome: string
  rotulo: string
  placeholder: string
  numerico?: boolean
}

export interface MeioPagamento {
  readonly id: string
  readonly rotulo: string
  /** Campos do formulário, agrupados por linha. */
  readonly campos: CampoPagamento[][]
  readonly aviso?: string
  readonly exibeQrCode?: boolean
  /** Mensagem de erro para o aluno, ou null quando os dados estão ok. */
  validar(dados: DadosPagamento): string | null
  /** Como o pagamento aparece no ticket do balcão. */
  descrever(dados: DadosPagamento): string
}
