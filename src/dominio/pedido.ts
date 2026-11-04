import type { Pedido, StatusPedido } from './tipos'

// Regra de transição única: o status só anda para a próxima etapa.
const PROXIMO_STATUS: Record<StatusPedido, StatusPedido | null> = {
  recebido: 'preparo',
  preparo: 'pronto',
  pronto: 'retirado',
  retirado: null,
}

export const ETAPAS: { status: StatusPedido; nome: string }[] = [
  { status: 'recebido', nome: 'Recebido' },
  { status: 'preparo', nome: 'Em preparo' },
  { status: 'pronto', nome: 'Pronto' },
  { status: 'retirado', nome: 'Retirado' },
]

export function proximoStatus(status: StatusPedido): StatusPedido | null {
  return PROXIMO_STATUS[status]
}

/** Devolve o pedido na etapa seguinte; um pedido já retirado fica como está. */
export function avancar(pedido: Pedido): Pedido {
  const proximo = proximoStatus(pedido.status)
  return proximo ? { ...pedido, status: proximo } : pedido
}

export function estaNaFila(pedido: Pedido): boolean {
  return pedido.status === 'recebido' || pedido.status === 'preparo'
}

export function pedidosNaFrente(pedido: Pedido, todos: Pedido[]): number {
  return todos.filter((p) => estaNaFila(p) && p.criadoEm < pedido.criadoEm).length
}

export function formatarSenha(numero: number): string {
  return 'A-' + String(numero).padStart(3, '0')
}
