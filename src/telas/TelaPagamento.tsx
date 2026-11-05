import { BotaoConfirmarPagamento, PainelPagadoresRacha } from '../componentes/PagamentoRachado'
import type { ItemPedido } from '../dominio/tipos'
import type { CheckoutHook } from '../hooks/useCheckout'
import type { CampoPagamento } from '../pagamento'

type Props = { checkout: CheckoutHook; itens: ItemPedido[]; total: number; aoVoltar: () => void; aoPagar: () => void }

export function TelaPagamento({ checkout, itens, total, aoVoltar, aoPagar }: Props) {
  const { meio, meios } = checkout
  const cotas = checkout.divisao.cotasDe(itens, checkout.nome)

  function campo(c: CampoPagamento) {
    return (
      <label key={c.nome}>
        {c.rotulo}
        <input
          inputMode={c.numerico ? 'numeric' : undefined}
          placeholder={c.placeholder}
          value={checkout.dados[c.nome] ?? ''}
          onChange={(e) => checkout.setDado(c.nome, e.target.value)}
        />
      </label>
    )
  }

  return (
    <section className="painel estreito">
      <button className="voltar" onClick={aoVoltar}>
        ← Carrinho
      </button>
      <h1 className="display">Pagamento</h1>
      <PainelPagadoresRacha checkout={checkout} cotas={cotas} />
      <div className="metodos">
        {meios.map((m) => (
          <label key={m.id} className={'metodo' + (m.id === meio.id ? ' selecionado' : '')}>
            <input type="radio" name="metodo" checked={m.id === meio.id} onChange={() => checkout.setMeioId(m.id)} />
            <span>{m.rotulo}</span>
          </label>
        ))}
      </div>
      {(meio.exibeQrCode || meio.aviso) && (
        <div className="pix">
          {meio.exibeQrCode && <div className="qr" aria-hidden="true" />}
          {meio.aviso && <p className="suave pequeno">{meio.aviso}</p>}
        </div>
      )}
      {meio.campos.length > 0 && (
        <div className="form">
          {meio.campos.map((linha) =>
            linha.length === 1 ? (
              campo(linha[0])
            ) : (
              <div key={linha.map((c) => c.nome).join('-')} className="linha">
                {linha.map(campo)}
              </div>
            ),
          )}
        </div>
      )}
      {checkout.erro && <p className="erro">{checkout.erro}</p>}
      <BotaoConfirmarPagamento checkout={checkout} total={total} cotas={cotas} aoPagar={aoPagar} />
    </section>
  )
}
