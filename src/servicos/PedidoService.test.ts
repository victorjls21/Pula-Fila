import { describe, expect, it } from 'vitest'
import { meiosPagamento } from '../pagamento'
import { MemoriaPedidoRepositorio } from '../repositorio/MemoriaPedidoRepositorio'
import { ERRO_SEM_NOME, PedidoService, type NovoPedido } from './PedidoService'

function criar() {
  const repositorio = new MemoriaPedidoRepositorio()
  const servico = new PedidoService(repositorio, meiosPagamento, {
    processarPagamento: async () => {},
    agora: () => 1000,
  })
  return { repositorio, servico }
}

const pedidoPix = (extra: Partial<NovoPedido> = {}): NovoPedido => ({
  cliente: '  Ana  ',
  carrinho: { 'coxinha-frango': 2, 'suco-recife': 1 },
  retirada: 'Assim que ficar pronto',
  meioPagamentoId: 'pix',
  dadosPagamento: {},
  ...extra,
})

const cartao = (dados: Record<string, string>) => pedidoPix({ meioPagamentoId: 'cartao', dadosPagamento: dados })
const cartaoValido = { numero: '4111 1111 1111 1234', validade: '12/29', cvv: '123' }

describe('PedidoService.finalizarPedido', () => {
  it('cria o pedido com senha, total e itens a partir do carrinho', async () => {
    const { servico, repositorio } = criar()
    const resultado = await servico.finalizarPedido(pedidoPix())
    expect(resultado).toEqual({
      ok: true,
      pedido: {
        senha: 'A-001',
        cliente: 'Ana',
        itens: [
          { id: 'coxinha-frango', nome: 'Coxinha de frango', preco: 12, qtd: 2 },
          { id: 'suco-recife', nome: 'Suco Recife', preco: 7.5, qtd: 1 },
        ],
        total: 31.5,
        pagamento: 'Pix',
        retirada: 'Assim que ficar pronto',
        status: 'recebido',
        criadoEm: 1000,
      },
    })
    expect(repositorio.listar()).toHaveLength(1)
  })

  it('numera as senhas em sequência', async () => {
    const { servico } = criar()
    await servico.finalizarPedido(pedidoPix())
    const segundo = await servico.finalizarPedido(pedidoPix())
    expect(segundo.ok && segundo.pedido.senha).toBe('A-002')
  })

  it.each<[string, NovoPedido, string]>([
    ['sem nome', pedidoPix({ cliente: '   ' }), ERRO_SEM_NOME],
    ['carrinho vazio', pedidoPix({ carrinho: {} }), 'Seu carrinho está vazio.'],
    ['item fora do cardápio', pedidoPix({ carrinho: { 'nao-existe': 1 } }), 'Seu carrinho está vazio.'],
    ['meio desconhecido', pedidoPix({ meioPagamentoId: 'boleto' }), 'Meio de pagamento desconhecido.'],
    ['cartão curto', cartao({ ...cartaoValido, numero: '1234' }), 'O número do cartão precisa ter 16 dígitos.'],
    ['validade inválida', cartao({ ...cartaoValido, validade: '13/29' }), 'Validade no formato MM/AA.'],
    ['CVV com letras', cartao({ ...cartaoValido, cvv: 'abc' }), 'CVV precisa ter 3 dígitos.'],
  ])('recusa %s sem gravar nada', async (_caso, novo, erro) => {
    const { servico, repositorio } = criar()
    expect(await servico.finalizarPedido(novo)).toEqual({ ok: false, erro })
    expect(repositorio.listar()).toEqual([])
  })

  it('descreve o cartão pelos 4 últimos dígitos', async () => {
    const { servico } = criar()
    const resultado = await servico.finalizarPedido(cartao(cartaoValido))
    expect(resultado.ok && resultado.pedido.pagamento).toBe('Cartão final 1234')
  })

  it('só cobra depois de validar', async () => {
    let cobrancas = 0
    const servico = new PedidoService(new MemoriaPedidoRepositorio(), meiosPagamento, {
      processarPagamento: async () => {
        cobrancas++
      },
    })
    await servico.finalizarPedido(pedidoPix({ cliente: '' }))
    await servico.finalizarPedido(pedidoPix())
    expect(cobrancas).toBe(1)
  })

  it('finaliza pedido rachado permitindo que cada colega escolha seu próprio meio de pagamento', async () => {
    const { servico } = criar()
    const resultado = await servico.finalizarPedido(
      pedidoPix({
        cliente: 'Ana',
        pagamentos: [
          { nome: 'Ana', valor: 15.75, meioPagamentoId: 'pix', dadosPagamento: {} },
          { nome: 'Lucas', valor: 15.75, meioPagamentoId: 'cartao', dadosPagamento: cartaoValido },
        ],
      }),
    )
    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.pedido.pagamento).toBe('Rachado (2): Ana (Pix) · Lucas (Cartão final 1234)')
      expect(resultado.pedido.divisao).toEqual([
        { nome: 'Ana', valor: 15.75, pagamento: 'Pix' },
        { nome: 'Lucas', valor: 15.75, pagamento: 'Cartão final 1234' },
      ])
    }
  })

  it('recusa pedido rachado quando um colega tem cartão inválido ou a soma não bate', async () => {
    const { servico } = criar()
    const cartaoRuim = await servico.finalizarPedido(
      pedidoPix({
        pagamentos: [
          { nome: 'Ana', valor: 15.75, meioPagamentoId: 'pix', dadosPagamento: {} },
          { nome: 'Lucas', valor: 15.75, meioPagamentoId: 'cartao', dadosPagamento: { ...cartaoValido, cvv: '1' } },
        ],
      }),
    )
    expect(cartaoRuim).toEqual({ ok: false, erro: 'Lucas: CVV precisa ter 3 dígitos.' })

    const somaErrada = await servico.finalizarPedido(
      pedidoPix({
        pagamentos: [
          { nome: 'Ana', valor: 10, meioPagamentoId: 'pix', dadosPagamento: {} },
          { nome: 'Lucas', valor: 10, meioPagamentoId: 'pix', dadosPagamento: {} },
        ],
      }),
    )
    expect(somaErrada).toEqual({ ok: false, erro: 'A soma das partes não bate com o total do pedido.' })
  })
})

describe('PedidoService no balcão', () => {
  it('avança recebido → preparo → pronto → retirado e para no fim', async () => {
    const { servico } = criar()
    await servico.finalizarPedido(pedidoPix())
    const status = () => servico.listar()[0].status
    const visto = [status()]
    for (let i = 0; i < 4; i++) {
      servico.avancarStatus('A-001')
      visto.push(status())
    }
    expect(visto).toEqual(['recebido', 'preparo', 'pronto', 'retirado', 'retirado'])
  })

  it('ignora senha inexistente', () => {
    const { servico } = criar()
    expect(() => servico.avancarStatus('A-999')).not.toThrow()
  })

  it('zerar o dia apaga os pedidos e reinicia as senhas', async () => {
    const { servico } = criar()
    await servico.finalizarPedido(pedidoPix())
    servico.zerarDia()
    expect(servico.listar()).toEqual([])
    const novo = await servico.finalizarPedido(pedidoPix())
    expect(novo.ok && novo.pedido.senha).toBe('A-001')
  })
})
