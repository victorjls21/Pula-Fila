import type { CotaDivisao } from '../divisao'
import { formatarPreco } from '../dominio/dinheiro'
import type { CheckoutHook } from '../hooks/useCheckout'

type PropsPainel = {
  checkout: CheckoutHook
  cotas: CotaDivisao[]
}

export function PainelPagadoresRacha({ checkout, cotas }: PropsPainel) {
  const { divisao } = checkout
  if (!divisao.ativa || cotas.length <= 1) return null
  const cotaAtual = cotas[divisao.indicePagador] ?? cotas[0]

  function selecionar(indice: number) {
    checkout.limparErro()
    divisao.selecionarPagador(indice)
  }

  return (
    <div className="racha-pagamento">
      <div className="racha-chips">
        {cotas.map((cota, idx) => {
          const pago = divisao.escolhas[idx]?.confirmado
          const ativo = idx === divisao.indicePagador
          return (
            <button
              key={idx}
              type="button"
              className={'chip' + (ativo ? ' ativo' : '') + (pago ? ' pago' : '')}
              onClick={() => selecionar(idx)}
            >
              {pago ? '✓ ' : `${idx + 1}. `}
              {cota.nome} · {formatarPreco(cota.valor)}
            </button>
          )
        })}
      </div>
      <div className="racha-vez">
        <span>
          Pessoa {divisao.indicePagador + 1} de {cotas.length}: <strong>{cotaAtual.nome}</strong> escolhe como pagar
        </span>
        <span className="etiqueta-preco">{formatarPreco(cotaAtual.valor)}</span>
      </div>
      {cotaAtual.itens.length > 0 && <p className="suave pequeno">Itens: {cotaAtual.itens.join(', ')}</p>}
    </div>
  )
}

type PropsBotao = {
  checkout: CheckoutHook
  total: number
  cotas: CotaDivisao[]
  aoPagar: () => void
}

function rotuloBotaoRachado(processando: boolean, ehUltimo: boolean, cota: CotaDivisao): string {
  if (processando) return 'Processando…'
  const parte = `${cota.nome} (${formatarPreco(cota.valor)})`
  return ehUltimo ? `Pagar parte de ${parte} e finalizar` : `Confirmar parte de ${parte} →`
}

export function BotaoConfirmarPagamento({ checkout, total, cotas, aoPagar }: PropsBotao) {
  const { divisao } = checkout
  if (!divisao.ativa || cotas.length <= 1) {
    return (
      <button className="botao primario cheio" disabled={checkout.processando} onClick={aoPagar}>
        {checkout.processando ? 'Processando…' : 'Pagar ' + formatarPreco(total)}
      </button>
    )
  }

  const ehUltimo = divisao.indicePagador >= cotas.length - 1
  const cotaAtual = cotas[divisao.indicePagador] ?? cotas[0]

  function acao() {
    if (checkout.confirmarColegaAtual(cotas.length) && ehUltimo) aoPagar()
  }

  return (
    <button className="botao primario cheio" disabled={checkout.processando} onClick={acao}>
      {rotuloBotaoRachado(checkout.processando, ehUltimo, cotaAtual)}
    </button>
  )
}
