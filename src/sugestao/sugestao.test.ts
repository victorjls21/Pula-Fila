import { describe, expect, it } from 'vitest'
import { buscarItem, todosItens } from '../dominio/cardapio'
import type { ItemCardapio } from '../dominio/tipos'
import { cabe, estimarMinutos, gerarCombos, montarCombo, sugerirCombos } from './combos'
import type { Combo, EstrategiaSugestao } from './EstrategiaSugestao'
import { DividaComAmigos, Leve, MaisEmConta, MaisRapido, MataFome } from './estrategias'
import { estrategiasSugestao } from '.'

const item = (id: string) => buscarItem(id) as ItemCardapio
const candidatos = gerarCombos(todosItens, 0)

describe('gerarCombos', () => {
  it('sempre tem principal + bebida, com ou sem sobremesa', () => {
    for (const c of candidatos) {
      expect(c.itens.map((i) => i.tipo)).toEqual(c.itens.length === 2 ? ['principal', 'bebida'] : ['principal', 'bebida', 'sobremesa'])
    }
  })

  it('gera todas as combinações (30 principais × 6 bebidas × 9 opções de sobremesa)', () => {
    expect(candidatos).toHaveLength(30 * 6 * 9)
    expect(new Set(candidatos.map((c) => c.id)).size).toBe(candidatos.length)
  })
})

describe('montarCombo', () => {
  it('soma o preço em centavos, sem erro de ponto flutuante', () => {
    const c = montarCombo([item('tapioca-carne-sol-queijo'), item('suco-recife'), item('bolo-rolo')], 0)
    expect(c.preco).toBe(34.9)
  })

  it('fica pronto quando o item mais demorado fica, mais 1 min por pedido na fila', () => {
    const itens = [item('tapioca-carne-sol-queijo'), item('agua-mineral')]
    expect(estimarMinutos(itens, 0)).toBe(8)
    expect(estimarMinutos(itens, 3)).toBe(11)
  })
})

describe('sugerirCombos', () => {
  it('só sugere o que cabe no bolso e no tempo', () => {
    const restricoes = { orcamento: 15, minutosDisponiveis: 5 }
    for (const e of estrategiasSugestao) {
      for (const c of sugerirCombos(e, restricoes, candidatos)) expect(cabe(c, restricoes)).toBe(true)
    }
  })

  it('o exemplo do professor existe: combo de até R$ 15, pronto em até 5 min', () => {
    const [primeiro] = sugerirCombos(new MaisEmConta(), { orcamento: 15, minutosDisponiveis: 5 }, candidatos)
    expect(primeiro.itens.map((i) => i.id)).toEqual(['enroladinho-salsicha', 'agua-mineral'])
    expect([primeiro.preco, primeiro.minutos]).toEqual([14.5, 2])
  })

  it('não repete o prato principal e respeita o limite', () => {
    const sugestoes = sugerirCombos(new MaisEmConta(), { orcamento: 30, minutosDisponiveis: 15 }, candidatos, 3)
    expect(sugestoes).toHaveLength(3)
    expect(new Set(sugestoes.map((c) => c.itens[0].id)).size).toBe(3)
  })

  it('a fila pode tirar combos da janela de tempo', () => {
    const restricoes = { orcamento: 30, minutosDisponiveis: 5 }
    const semFila = sugerirCombos(new MaisEmConta(), restricoes, gerarCombos(todosItens, 0))
    const filaGrande = sugerirCombos(new MaisEmConta(), restricoes, gerarCombos(todosItens, 10))
    expect(semFila.length).toBeGreaterThan(0)
    expect(filaGrande).toEqual([])
  })

  it('aceita uma estratégia nova sem mudar nada no código existente (Aberto/Fechado)', () => {
    const soCroissant: EstrategiaSugestao = {
      id: 'croissant',
      nome: 'Só croissant',
      descricao: '',
      aceita: (c: Combo) => c.itens[0].categoria === 'Croissant',
      comparar: (a: Combo, b: Combo) => a.preco - b.preco,
    }
    const sugestoes = sugerirCombos(soCroissant, { orcamento: 30, minutosDisponiveis: 15 }, candidatos)
    expect(sugestoes.length).toBeGreaterThan(0)
    expect(sugestoes.every((c) => c.itens[0].categoria === 'Croissant')).toBe(true)
  })
})

describe('estratégias', () => {
  const restricoes = { orcamento: 30, minutosDisponiveis: 15 }
  const sugerir = (e: EstrategiaSugestao) => sugerirCombos(e, restricoes, candidatos)

  it('Mais em conta: preço crescente', () => {
    const precos = sugerir(new MaisEmConta()).map((c) => c.preco)
    expect(precos).toEqual([...precos].sort((a, b) => a - b))
  })

  it('Mais rápido: o primeiro sai em 1 minuto', () => {
    expect(sugerir(new MaisRapido())[0].minutos).toBe(1)
  })

  it('Mata a fome: combos com sobremesa, aproveitando o orçamento', () => {
    const sugestoes = sugerir(new MataFome())
    expect(sugestoes.every((c) => c.itens.length === 3)).toBe(true)
    expect(sugestoes[0].preco).toBeGreaterThan(28)
  })

  it('Leve: só itens marcados como leves', () => {
    const sugestoes = sugerir(new Leve())
    expect(sugestoes.length).toBeGreaterThan(0)
    expect(sugestoes.flatMap((c) => c.itens).every((i) => i.leve)).toBe(true)
  })

  it('Divida com amigos: combo triplo (3 pessoas) com coxinha, refrigerante e brownie em destaque', () => {
    const sugestoes = sugerir(new DividaComAmigos())
    expect(sugestoes).toHaveLength(3)
    expect(sugestoes[0].pessoas).toBe(3)
    expect(sugestoes[0].itens.map((i) => i.id)).toEqual(['coxinha-frango', 'refrigerante-lata', 'brownie-vo-carminha'])
    expect(sugestoes[0].preco).toBe(82.5)
  })

  it('ids únicos no registro', () => {
    expect(new Set(estrategiasSugestao.map((e) => e.id)).size).toBe(estrategiasSugestao.length)
  })
})
