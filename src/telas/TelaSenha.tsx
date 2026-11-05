import { formatarPreco } from '../dominio/dinheiro'
import { ETAPAS, estaNaFila, pedidosNaFrente } from '../dominio/pedido'
import type { Pedido } from '../dominio/tipos'

type Props = { pedido: Pedido; pedidos: Pedido[]; aoFazerOutro: () => void }

function textoFila(naFrente: number): string {
  if (naFrente === 0) return 'Você é o próximo!'
  return naFrente + (naFrente === 1 ? ' pedido' : ' pedidos') + ' na sua frente'
}

export function TelaSenha({ pedido, pedidos, aoFazerOutro }: Props) {
  const indice = ETAPAS.findIndex((e) => e.status === pedido.status)
  return (
    <>
      {pedido.status === 'pronto' && <div className="alerta-pronto">🔔 Seu pedido está pronto! Corre no balcão.</div>}
      <section className="painel centro estreito">
        <p className="suave">Sua senha</p>
        <div className="senha-grande">{pedido.senha}</div>
        <p>
          {pedido.cliente}, retirada: <strong>{pedido.retirada}</strong>
        </p>
        <ol className="etapas">
          {ETAPAS.map((e, i) => (
            <li key={e.status} className={i <= indice ? 'feita' : ''}>
              {e.nome}
            </li>
          ))}
        </ol>
        {estaNaFila(pedido) && <p className="etiqueta-preco">{textoFila(pedidosNaFrente(pedido, pedidos))}</p>}
        <ul className="resumo">
          {pedido.itens.map((i) => (
            <li key={i.id}>
              <span>
                {i.qtd}× {i.nome}
              </span>
              <span>{formatarPreco(i.preco * i.qtd)}</span>
            </li>
          ))}
          <li className="total">
            <span>Total ({pedido.pagamento})</span>
            <span>{formatarPreco(pedido.total)}</span>
          </li>
        </ul>
        {pedido.divisao && (
          <ul className="resumo">
            {pedido.divisao.map((c, idx) => (
              <li key={idx}>
                <span>
                  👥 {c.nome} <small className="suave">({c.pagamento})</small>
                </span>
                <span>{formatarPreco(c.valor)}</span>
              </li>
            ))}
          </ul>
        )}
        <button className="botao contorno" onClick={aoFazerOutro}>
          Fazer outro pedido
        </button>
      </section>
    </>
  )
}
