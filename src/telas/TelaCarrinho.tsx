import { Passo } from '../componentes/Quantidade'
import { RacharPedido } from '../componentes/RacharPedido'
import { buscarItem, emojiDaCategoria } from '../dominio/cardapio'
import { formatarPreco } from '../dominio/dinheiro'
import type { CarrinhoHook } from '../hooks/useCarrinho'
import type { CheckoutHook } from '../hooks/useCheckout'

type Props = { carrinho: CarrinhoHook; checkout: CheckoutHook; aoVoltar: () => void; aoContinuar: () => void }

export function TelaCarrinho({ carrinho, checkout, aoVoltar, aoContinuar }: Props) {
  const { resumo } = carrinho

  function continuar() {
    if (checkout.conferirNome(resumo.itens)) aoContinuar()
  }

  return (
    <section className="painel estreito">
      <button className="voltar" onClick={aoVoltar}>
        ← Cardápio
      </button>
      <h1 className="display">Seu pedido</h1>
      {resumo.quantidade === 0 && <p className="vazio">Carrinho vazio. Bora escolher um lanche?</p>}
      <ul className="resumo">
        {resumo.itens.map((item) => (
          <li key={item.id}>
            <span>
              {emojiDaCategoria(buscarItem(item.id)?.categoria ?? '')} {item.nome}
            </span>
            <Passo nome={item.nome} quantidade={item.qtd} aoAdicionar={() => carrinho.adicionar(item.id)} aoRemover={() => carrinho.remover(item.id)} />
          </li>
        ))}
        {resumo.quantidade > 0 && (
          <li className="total">
            <span>Total</span>
            <span>{formatarPreco(resumo.total)}</span>
          </li>
        )}
      </ul>
      <div className="form">
        <label>
          Seu nome
          <input placeholder="Como te chamamos no balcão" value={checkout.nome} onChange={(e) => checkout.setNome(e.target.value)} />
        </label>
        <label>
          Retirada
          <select value={checkout.retirada} onChange={(e) => checkout.setRetirada(e.target.value)}>
            {checkout.horarios.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
      </div>
      <RacharPedido
        itens={resumo.itens}
        nomePrincipal={checkout.nome}
        aoMudarNomePrincipal={checkout.setNome}
        divisao={checkout.divisao}
      />
      {checkout.erro && <p className="erro">{checkout.erro}</p>}
      <button className="botao primario cheio" disabled={resumo.quantidade === 0} onClick={continuar}>
        Ir para o pagamento
      </button>
    </section>
  )
}
