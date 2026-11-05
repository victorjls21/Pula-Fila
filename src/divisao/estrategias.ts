import { deCentavos, paraCentavos } from '../dominio/dinheiro'
import type { ItemPedido } from '../dominio/tipos'
import type { CotaDivisao, DadosDivisao, EstrategiaDivisao, ItemUnitario } from './EstrategiaDivisao'

export function desmembrarItens(itens: ItemPedido[]): ItemUnitario[] {
  return itens.flatMap((item) =>
    Array.from({ length: item.qtd }, (_, i) => ({
      chave: `${item.id}:${i}`,
      id: item.id,
      rotulo: item.qtd > 1 ? `${item.nome} (${i + 1}/${item.qtd})` : item.nome,
      preco: item.preco,
    })),
  )
}

export function nomeParticipante(nome: string, indice: number): string {
  return nome.trim() || `Colega ${indice + 1}`
}

function donoValido(dono: number | undefined, totalParticipantes: number): number {
  if (dono === undefined || dono < 0 || dono >= totalParticipantes) return 0
  return dono
}

export class DivisaoIgualitaria implements EstrategiaDivisao {
  readonly id = 'igual'
  readonly nome = '🤝 Igual pra todos'
  readonly descricao = 'Divide o total igualmente (ajustando centavos se precisar).'

  calcular(itens: ItemPedido[], dados: DadosDivisao): CotaDivisao[] {
    const n = Math.max(1, dados.participantes.length)
    const totalCentavos = itens.reduce((soma, i) => soma + paraCentavos(i.preco) * i.qtd, 0)
    const base = Math.floor(totalCentavos / n)
    const resto = totalCentavos % n
    return dados.participantes.map((nome, idx) => ({
      nome: nomeParticipante(nome, idx),
      valor: deCentavos(base + (idx < resto ? 1 : 0)),
      itens: [],
    }))
  }
}

export class DivisaoPorItem implements EstrategiaDivisao {
  readonly id = 'por-item'
  readonly nome = '🥐 Cada um paga o seu'
  readonly descricao = 'Toque em quem pediu cada item para somar separado.'
  readonly exigeEscolhaPorItem = true

  calcular(itens: ItemPedido[], dados: DadosDivisao): CotaDivisao[] {
    const n = Math.max(1, dados.participantes.length)
    const unidades = desmembrarItens(itens)
    return dados.participantes.map((nome, idx) => {
      const minhas = unidades.filter((u) => donoValido(dados.donoPorUnidade[u.chave], n) === idx)
      const centavos = minhas.reduce((soma, u) => soma + paraCentavos(u.preco), 0)
      return {
        nome: nomeParticipante(nome, idx),
        valor: deCentavos(centavos),
        itens: minhas.map((u) => u.rotulo),
      }
    })
  }
}

