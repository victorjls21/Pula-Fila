import { describe, expect, it } from 'vitest'
import type { Pedido } from '../dominio/tipos'
import { novosProntos, senhaFalada, senhasProntas, textoAnuncio } from './anuncio'

const pedido = (senha: string, status: Pedido['status'], nomes: string[] = ['Coxinha de frango'], cliente = 'Tales Cavalcanti'): Pedido => ({
  senha,
  cliente,
  itens: nomes.map((nome, i) => ({ id: 'item-' + i, nome, preco: 10, qtd: 1 })),
  total: 10 * nomes.length,
  pagamento: 'Pix',
  retirada: 'Assim que ficar pronto',
  status,
  criadoEm: 1,
})

describe('textoAnuncio', () => {
  it('lê a senha sem os zeros e chama pelo primeiro nome', () => {
    expect(senhaFalada('A-042')).toBe('A 42')
    expect(textoAnuncio(pedido('A-042', 'pronto'))).toBe('Senha A 42, Tales! Coxinha de frango saindo! Pode retirar no balcão.')
  })

  it('cita até dois itens, ligados por "e"', () => {
    expect(textoAnuncio(pedido('A-001', 'pronto', ['Coxinha de frango', 'Suco Recife']))).toContain('Coxinha de frango e Suco Recife saindo!')
  })

  it('com três itens ou mais, fala só que o pedido está pronto', () => {
    expect(textoAnuncio(pedido('A-001', 'pronto', ['Coxinha', 'Suco', 'Bolo']))).toBe('Senha A 1, Tales! Seu pedido está pronto! Pode retirar no balcão.')
  })
})

describe('detecção de pedidos que acabaram de ficar prontos', () => {
  it('anuncia só quem virou pronto desde a última olhada', () => {
    const antes = [pedido('A-001', 'pronto'), pedido('A-002', 'preparo')]
    const depois = [pedido('A-001', 'pronto'), pedido('A-002', 'pronto'), pedido('A-003', 'recebido')]
    expect(novosProntos(senhasProntas(antes), depois).map((p) => p.senha)).toEqual(['A-002'])
  })

  it('depois de zerar o dia, a nova A-001 volta a ser anunciada', () => {
    const anunciadasAntesDeZerar = senhasProntas([pedido('A-001', 'pronto')])
    const vistasDepoisDeZerar = senhasProntas([]) // o hook guarda só as prontas atuais
    expect(novosProntos(anunciadasAntesDeZerar, [pedido('A-001', 'pronto')])).toEqual([])
    expect(novosProntos(vistasDepoisDeZerar, [pedido('A-001', 'pronto')]).map((p) => p.senha)).toEqual(['A-001'])
  })
})
