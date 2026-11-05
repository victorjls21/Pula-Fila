import { describe, expect, it } from 'vitest'
import type { ItemPedido } from '../dominio/tipos'
import { desmembrarItens, DivisaoIgualitaria, DivisaoPorItem, estrategiasDivisao, type EstrategiaDivisao } from '.'

const itensExemplo: ItemPedido[] = [
  { id: 'coxinha-frango', nome: 'Coxinha de frango', preco: 12, qtd: 2 },
  { id: 'suco-recife', nome: 'Suco Recife', preco: 7.5, qtd: 1 },
]

describe('desmembrarItens', () => {
  it('separa itens com quantidade > 1 em unidades individuais numeradas', () => {
    const unidades = desmembrarItens(itensExemplo)
    expect(unidades).toEqual([
      { chave: 'coxinha-frango:0', id: 'coxinha-frango', rotulo: 'Coxinha de frango (1/2)', preco: 12 },
      { chave: 'coxinha-frango:1', id: 'coxinha-frango', rotulo: 'Coxinha de frango (2/2)', preco: 12 },
      { chave: 'suco-recife:0', id: 'suco-recife', rotulo: 'Suco Recife', preco: 7.5 },
    ])
  })
})

describe('DivisaoIgualitaria', () => {
  const estrategia = new DivisaoIgualitaria()

  it('divide exatamente pela metade quando o valor em centavos é par', () => {
    const cotas = estrategia.calcular(itensExemplo, {
      participantes: ['Ana', 'Bia'],
      donoPorUnidade: {},
    })
    expect(cotas).toEqual([
      { nome: 'Ana', valor: 15.75, itens: [] },
      { nome: 'Bia', valor: 15.75, itens: [] },
    ])
  })

  it('distribui os centavos de resto sem perder nem criar dinheiro (ex.: R$ 10,00 ÷ 3)', () => {
    const itens: ItemPedido[] = [{ id: 'pao', nome: 'Pão', preco: 10, qtd: 1 }]
    const cotas = estrategia.calcular(itens, {
      participantes: ['Ana', 'Bia', 'Caio'],
      donoPorUnidade: {},
    })
    expect(cotas.map((c) => c.valor)).toEqual([3.34, 3.33, 3.33])
    const soma = Math.round(cotas.reduce((s, c) => s + c.valor, 0) * 100) / 100
    expect(soma).toBe(10)
  })

  it('preenche nome padrão quando o colega deixa em branco', () => {
    const cotas = estrategia.calcular(itensExemplo, {
      participantes: ['Ana', '   '],
      donoPorUnidade: {},
    })
    expect(cotas[1].nome).toBe('Colega 2')
  })
})

describe('DivisaoPorItem', () => {
  const estrategia = new DivisaoPorItem()

  it('soma os itens atribuídos a cada colega', () => {
    const cotas = estrategia.calcular(itensExemplo, {
      participantes: ['Ana', 'Lucas'],
      donoPorUnidade: {
        'coxinha-frango:0': 0,
        'coxinha-frango:1': 1,
        'suco-recife:0': 1,
      },
    })
    expect(cotas).toEqual([
      { nome: 'Ana', valor: 12, itens: ['Coxinha de frango (1/2)'] },
      { nome: 'Lucas', valor: 19.5, itens: ['Coxinha de frango (2/2)', 'Suco Recife'] },
    ])
  })

  it('atribui ao primeiro participante quando a unidade não foi marcada ou o índice saiu da lista', () => {
    const cotas = estrategia.calcular(itensExemplo, {
      participantes: ['Ana', 'Lucas'],
      donoPorUnidade: { 'suco-recife:0': 99 },
    })
    expect(cotas.map((c) => c.valor)).toEqual([31.5, 0])
  })
})

describe('EstrategiaDivisao (Aberto/Fechado)', () => {
  it('aceita uma nova regra de divisão sem alterar as existentes', () => {
    // Ex.: Aniversariante (último da roda) não paga; os demais dividem igualmente
    const aniversarianteNaoPaga: EstrategiaDivisao = {
      id: 'aniversariante',
      nome: '🎂 Aniversariante na faixa',
      descricao: 'O último colega não paga.',
      calcular(itens, dados) {
        const pagantes = dados.participantes.slice(0, -1)
        const cotasPagantes = new DivisaoIgualitaria().calcular(itens, { ...dados, participantes: pagantes })
        const ultimo = dados.participantes[dados.participantes.length - 1]
        return [...cotasPagantes, { nome: ultimo, valor: 0, itens: [] }]
      },
    }
    const cotas = aniversarianteNaoPaga.calcular(itensExemplo, {
      participantes: ['Ana', 'Bia', 'Lucas'],
      donoPorUnidade: {},
    })
    expect(cotas.map((c) => c.valor)).toEqual([15.75, 15.75, 0])
  })

  it('ids únicos no registro de estratégias', () => {
    expect(new Set(estrategiasDivisao.map((e) => e.id)).size).toBe(estrategiasDivisao.length)
  })
})

