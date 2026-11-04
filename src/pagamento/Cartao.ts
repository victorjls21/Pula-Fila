import type { CampoPagamento, DadosPagamento, MeioPagamento } from './MeioPagamento'

const soDigitos = (texto = '') => texto.replace(/\D/g, '')

export class Cartao implements MeioPagamento {
  readonly id = 'cartao'
  readonly rotulo = '💳 Cartão'
  readonly campos: CampoPagamento[][] = [
    [{ nome: 'numero', rotulo: 'Número do cartão', placeholder: '0000 0000 0000 0000', numerico: true }],
    [
      { nome: 'validade', rotulo: 'Validade', placeholder: 'MM/AA' },
      { nome: 'cvv', rotulo: 'CVV', placeholder: '123', numerico: true },
    ],
  ]

  validar(dados: DadosPagamento): string | null {
    if (soDigitos(dados.numero).length !== 16) return 'O número do cartão precisa ter 16 dígitos.'
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(dados.validade)) return 'Validade no formato MM/AA.'
    if (!/^\d{3}$/.test(dados.cvv)) return 'CVV precisa ter 3 dígitos.'
    return null
  }

  descrever(dados: DadosPagamento): string {
    return 'Cartão final ' + soDigitos(dados.numero).slice(-4)
  }
}
