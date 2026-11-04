import type { Pedido } from '../dominio/tipos'

const listaFalada = new Intl.ListFormat('pt-BR', { style: 'long', type: 'conjunction' })

/** "A-007" vira "A 7", que a voz lê como "A sete" e não "A menos zero zero sete". */
export function senhaFalada(senha: string): string {
  const [letra, numero] = senha.split('-')
  return numero ? letra + ' ' + Number(numero) : senha
}

/** Ex.: "Senha A 42, Tales! Coxinha de frango e Suco Recife saindo! Pode retirar no balcão." */
export function textoAnuncio(pedido: Pedido): string {
  const primeiroNome = pedido.cliente.trim().split(/\s+/)[0]
  const nomes = pedido.itens.map((i) => i.nome)
  const oQue = nomes.length <= 2 ? listaFalada.format(nomes) + ' saindo!' : 'Seu pedido está pronto!'
  return 'Senha ' + senhaFalada(pedido.senha) + ', ' + primeiroNome + '! ' + oQue + ' Pode retirar no balcão.'
}

export function senhasProntas(pedidos: Pedido[]): Set<string> {
  return new Set(pedidos.filter((p) => p.status === 'pronto').map((p) => p.senha))
}

/** Pedidos que ficaram prontos desde a última olhada (as senhas já anunciadas vêm em `anunciadas`). */
export function novosProntos(anunciadas: Set<string>, pedidos: Pedido[]): Pedido[] {
  return pedidos.filter((p) => p.status === 'pronto' && !anunciadas.has(p.senha))
}
