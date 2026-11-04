import { formatarPreco } from '../dominio/dinheiro'
import { estaNaFila } from '../dominio/pedido'
import type { Pedido, StatusPedido } from '../dominio/tipos'
import { useServicos } from '../hooks/contexto'
import { confirmar } from '../hooks/navegador'

const COLUNAS: { status: StatusPedido; titulo: string; acao: string }[] = [
  { status: 'recebido', titulo: 'Recebidos', acao: 'Iniciar preparo' },
  { status: 'preparo', titulo: 'Em preparo', acao: 'Marcar pronto' },
  { status: 'pronto', titulo: 'Prontos', acao: 'Entregue' },
]

export function TelaBalcao({ pedidos }: { pedidos: Pedido[] }) {
  const { pedidos: servico } = useServicos()
  const naFila = pedidos.filter(estaNaFila).length
  const entregues = pedidos.filter((p) => p.status === 'retirado').length
  const faturamento = pedidos.reduce((soma, p) => soma + p.total, 0)

  function zerarDia() {
    if (confirmar('Apagar todos os pedidos e reiniciar as senhas?')) servico.zerarDia()
  }

  return (
    <>
      <section className="painel balcao-resumo">
        <div>
          <h1 className="display">Balcão</h1>
          <p className="suave">
            {naFila} na fila · {entregues} entregues · {formatarPreco(faturamento)} hoje
          </p>
        </div>
        <button className="botao contorno" onClick={zerarDia}>
          Zerar dia
        </button>
      </section>
      <div className="kanban">
        {COLUNAS.map((col) => {
          const lista = pedidos.filter((p) => p.status === col.status)
          return (
            <section key={col.status} className={'coluna coluna-' + col.status}>
              <h2>
                {col.titulo} <span className="contador">{lista.length}</span>
              </h2>
              {lista.length === 0 && <p className="vazio">Nada por aqui.</p>}
              {lista.map((p) => (
                <article key={p.senha} className="ticket">
                  <div className="ticket-topo">
                    <strong className="senha-pequena">{p.senha}</strong>
                    <span>{p.cliente}</span>
                  </div>
                  <ul>
                    {p.itens.map((i) => (
                      <li key={i.id}>
                        {i.qtd}× {i.nome}
                      </li>
                    ))}
                  </ul>
                  <p className="suave pequeno">
                    {p.retirada} · {p.pagamento} · {formatarPreco(p.total)}
                  </p>
                  <button className="botao primario cheio" onClick={() => servico.avancarStatus(p.senha)}>
                    {col.acao}
                  </button>
                </article>
              ))}
            </section>
          )
        })}
      </div>
    </>
  )
}
