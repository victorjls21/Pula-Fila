import { useEffect, useState } from 'react'
import type { Pedido } from '../dominio/tipos'
import { useServicos } from './contexto'
import { definirTitulo, vibrar } from './navegador'

const TITULO = 'Imperial Padaria'

/** O pedido que este aparelho acompanha, com aviso (título + vibração) quando fica pronto. */
export function useMeuPedido(pedidos: Pedido[]) {
  const { sessao } = useServicos()
  const [minhaSenha, setMinhaSenha] = useState(() => sessao.minhaSenha())
  const pedido = pedidos.find((p) => p.senha === minhaSenha)
  const senhaPronta = pedido?.status === 'pronto' ? pedido.senha : null

  useEffect(() => {
    if (!senhaPronta) {
      definirTitulo(TITULO)
      return
    }
    vibrar([200, 100, 200])
    definirTitulo('🔔 Pedido pronto! ' + senhaPronta)
  }, [senhaPronta])

  function acompanhar(senha: string) {
    sessao.salvarMinhaSenha(senha)
    setMinhaSenha(senha)
  }

  return { pedido, acompanhar }
}
