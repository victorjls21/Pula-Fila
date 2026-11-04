import { Cabecalho } from './componentes/Cabecalho'
import { useCarrinho } from './hooks/useCarrinho'
import { useCheckout } from './hooks/useCheckout'
import { useMeuPedido } from './hooks/useMeuPedido'
import { useNavegacao } from './hooks/useNavegacao'
import { usePedidos } from './hooks/usePedidos'
import { TelaBalcao } from './telas/TelaBalcao'
import { TelaCarrinho } from './telas/TelaCarrinho'
import { TelaInicio } from './telas/TelaInicio'
import { TelaPagamento } from './telas/TelaPagamento'
import { TelaSenha } from './telas/TelaSenha'
import './App.css'

// Só orquestra: escolhe a tela e liga os hooks. Regra de negócio fica em dominio/ e servicos/.
export default function App() {
  const navegacao = useNavegacao()
  const pedidos = usePedidos()
  const carrinho = useCarrinho()
  const checkout = useCheckout()
  const meu = useMeuPedido(pedidos)

  function abrirCarrinho() {
    checkout.atualizarHorarios()
    navegacao.irPara('carrinho')
  }

  async function pagar() {
    const pedido = await checkout.pagar(carrinho.itens)
    if (!pedido) return
    meu.acompanhar(pedido.senha)
    carrinho.esvaziar()
    navegacao.irPara('senha')
  }

  function conteudo() {
    if (navegacao.ehBalcao) return <TelaBalcao pedidos={pedidos} />
    if (navegacao.tela === 'senha' && meu.pedido) {
      return <TelaSenha pedido={meu.pedido} pedidos={pedidos} aoFazerOutro={() => navegacao.irPara('cardapio')} />
    }
    if (navegacao.tela === 'pagamento') {
      return <TelaPagamento checkout={checkout} total={carrinho.resumo.total} aoVoltar={abrirCarrinho} aoPagar={pagar} />
    }
    if (navegacao.tela === 'carrinho') {
      return <TelaCarrinho carrinho={carrinho} checkout={checkout} aoVoltar={() => navegacao.irPara('cardapio')} aoContinuar={() => navegacao.irPara('pagamento')} />
    }
    return (
      <TelaInicio
        carrinho={carrinho}
        navegacao={navegacao}
        meuPedido={meu.pedido}
        pedidos={pedidos}
        aoAcompanhar={() => navegacao.irPara('senha')}
        aoAbrirCarrinho={abrirCarrinho}
        aoEscolherCombo={(combo) => {
          carrinho.adicionarVarios(combo.itens.map((i) => i.id))
          abrirCarrinho()
        }}
      />
    )
  }

  return (
    <div className={navegacao.ehBalcao ? 'pagina larga' : 'pagina'}>
      <Cabecalho quantidade={carrinho.resumo.quantidade} aoEscolherCategoria={navegacao.irParaCardapio} aoAbrirCarrinho={abrirCarrinho} />
      {conteudo()}
    </div>
  )
}
