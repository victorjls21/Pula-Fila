import dados from '../cardapio.json'
import type { Categoria, Destaque, ItemCardapio } from './tipos'

type ArquivoCardapio = { categorias: Categoria[]; destaques: Destaque[]; maisPedidos: string[] }

// O JSON infere `tipo` como string; os testes de domínio conferem que todo valor é um TipoCategoria válido.
const arquivo = dados as ArquivoCardapio

export const categorias: Categoria[] = arquivo.categorias

export const todosItens: ItemCardapio[] = categorias.flatMap((c) => c.itens.map((i) => ({ ...i, categoria: c.nome, tipo: c.tipo })))

export const destaques: Destaque[] = arquivo.destaques

export function buscarItem(id: string): ItemCardapio | undefined {
  return todosItens.find((i) => i.id === id)
}

/** Itens dos ids pedidos, na mesma ordem, ignorando ids que não existem no cardápio. */
export function itensPorId(ids: string[]): ItemCardapio[] {
  return ids.map(buscarItem).filter((i): i is ItemCardapio => i !== undefined)
}

export const maisPedidos: ItemCardapio[] = itensPorId(arquivo.maisPedidos)

export function emojiDaCategoria(nome: string): string {
  return categorias.find((c) => c.nome === nome)?.emoji ?? '🍽️'
}

/** Com busca, procura no cardápio inteiro; sem busca, mostra a categoria escolhida. */
export function filtrarItens(busca: string, categoria: string): ItemCardapio[] {
  const termo = busca.trim().toLowerCase()
  if (termo) return todosItens.filter((i) => i.nome.toLowerCase().includes(termo))
  return todosItens.filter((i) => i.categoria === categoria)
}
