import { describe, expect, it } from 'vitest'
import { emojiDaCategoria, filtrarItens, maisPedidos, todosItens } from './cardapio'
import { adicionarItem, removerItem, resumirCarrinho } from './carrinho'
import { gerarHorariosRetirada, RETIRADA_IMEDIATA } from './horarios'
import { avancar, formatarSenha, pedidosNaFrente, proximoStatus } from './pedido'
import type { Pedido } from './tipos'

describe('carrinho', () => {
  it('adiciona e remove sem mutar o original', () => {
    const vazio = {}
    const um = adicionarItem(vazio, 'esfirra')
    const dois = adicionarItem(um, 'esfirra')
    expect(vazio).toEqual({})
    expect(dois).toEqual({ esfirra: 2 })
    expect(removerItem(dois, 'esfirra')).toEqual({ esfirra: 1 })
    expect(removerItem(um, 'esfirra')).toEqual({})
  })

  it('resume total e quantidade sem erro de ponto flutuante visível', () => {
    const resumo = resumirCarrinho({ 'bolo-rolo': 3, 'red-bull': 1 })
    expect(resumo.quantidade).toBe(4)
    expect(resumo.total.toFixed(2)).toBe('35.00')
  })
})

describe('pedido', () => {
  it('segue a ordem de etapas', () => {
    expect(proximoStatus('recebido')).toBe('preparo')
    expect(proximoStatus('retirado')).toBeNull()
  })

  it('avancar devolve um novo objeto e mantém o retirado como está', () => {
    const p = { status: 'pronto' } as Pedido
    expect(avancar(p)).toEqual({ status: 'retirado' })
    expect(p.status).toBe('pronto')
    const retirado = { status: 'retirado' } as Pedido
    expect(avancar(retirado)).toBe(retirado)
  })

  it('conta só quem está na fila e chegou antes', () => {
    const p = (status: Pedido['status'], criadoEm: number) => ({ status, criadoEm }) as Pedido
    const meu = p('recebido', 5)
    const todos = [p('recebido', 1), p('preparo', 2), p('pronto', 3), meu, p('recebido', 9)]
    expect(pedidosNaFrente(meu, todos)).toBe(2)
  })

  it('formata a senha com 3 dígitos', () => {
    expect(formatarSenha(7)).toBe('A-007')
    expect(formatarSenha(1234)).toBe('A-1234')
  })
})

describe('cardápio', () => {
  it('tem 44 itens com ids únicos', () => {
    const ids = todosItens.map((i) => i.id)
    expect(ids).toHaveLength(44)
    expect(new Set(ids).size).toBe(44)
  })

  it('busca no cardápio inteiro, sem diferenciar maiúsculas', () => {
    expect(filtrarItens('COXINHA', 'Bebidas').length).toBeGreaterThan(5)
    expect(filtrarItens('', 'Bebidas').every((i) => i.categoria === 'Bebidas')).toBe(true)
  })

  it('emoji e destaques vêm do JSON', () => {
    expect(emojiDaCategoria('Croissant')).toBe('🥐')
    expect(emojiDaCategoria('Inexistente')).toBe('🍽️')
    expect(maisPedidos.every((i) => i.descricao)).toBe(true)
  })
})

describe('horários de retirada', () => {
  it('começa com retirada imediata e segue de 15 em 15 min, com folga de 10 min', () => {
    expect(gerarHorariosRetirada(new Date(2026, 10, 4, 9, 50))).toEqual([RETIRADA_IMEDIATA, '10:00', '10:15', '10:30', '10:45', '11:00', '11:15'])
    expect(gerarHorariosRetirada(new Date(2026, 10, 4, 9, 51))[1]).toBe('10:15')
  })
})
