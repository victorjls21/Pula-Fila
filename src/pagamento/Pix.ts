import type { MeioPagamento } from './MeioPagamento'

export class Pix implements MeioPagamento {
  readonly id = 'pix'
  readonly rotulo = '⚡ Pix'
  readonly campos = []
  readonly aviso = 'Simulação: o Pix é aprovado assim que você confirmar.'
  readonly exibeQrCode = true

  validar(): string | null {
    return null
  }

  descrever(): string {
    return 'Pix'
  }
}
