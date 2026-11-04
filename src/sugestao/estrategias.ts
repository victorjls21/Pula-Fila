import type { Combo, EstrategiaSugestao } from './EstrategiaSugestao'

const maisBarato = (a: Combo, b: Combo) => a.preco - b.preco
const maisRapido = (a: Combo, b: Combo) => a.minutos - b.minutos

export class MaisEmConta implements EstrategiaSugestao {
  readonly id = 'em-conta'
  readonly nome = '💸 Mais em conta'
  readonly descricao = 'O menor preço primeiro.'

  aceita(): boolean {
    return true
  }

  comparar(a: Combo, b: Combo): number {
    return maisBarato(a, b) || maisRapido(a, b)
  }
}

export class MaisRapido implements EstrategiaSugestao {
  readonly id = 'rapido'
  readonly nome = '⚡ Mais rápido'
  readonly descricao = 'O que sai primeiro do balcão.'

  aceita(): boolean {
    return true
  }

  comparar(a: Combo, b: Combo): number {
    return maisRapido(a, b) || maisBarato(a, b)
  }
}

export class MataFome implements EstrategiaSugestao {
  readonly id = 'mata-fome'
  readonly nome = '🍽️ Mata a fome'
  readonly descricao = 'Com sobremesa e aproveitando o orçamento.'

  aceita(): boolean {
    return true
  }

  comparar(a: Combo, b: Combo): number {
    return b.itens.length - a.itens.length || b.preco - a.preco || maisRapido(a, b)
  }
}

export class Leve implements EstrategiaSugestao {
  readonly id = 'leve'
  readonly nome = '🥗 Leve'
  readonly descricao = 'Sanduíche natural, fruta e bebida sem açúcar adicionado.'

  aceita(combo: Combo): boolean {
    return combo.itens.every((i) => i.leve)
  }

  comparar(a: Combo, b: Combo): number {
    return maisBarato(a, b) || maisRapido(a, b)
  }
}
