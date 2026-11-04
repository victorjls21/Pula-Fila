import { useEffect, useState } from 'react'
import type { Pedido } from '../dominio/tipos'
import { useServicos } from './contexto'

/** Lista de pedidos sempre atualizada, inclusive quando outra aba (o balcão) muda algo. */
export function usePedidos(): Pedido[] {
  const { pedidos: servico } = useServicos()
  const [pedidos, setPedidos] = useState(() => servico.listar())
  useEffect(() => servico.observar(setPedidos), [servico])
  return pedidos
}
