import { useState } from 'react'
import { Foto } from '../componentes/Foto'
import { BotaoQuantidade } from '../componentes/Quantidade'
import { buscarItem, categorias, destaques, filtrarItens, maisPedidos } from '../dominio/cardapio'
import { formatarPreco } from '../dominio/dinheiro'
import { estaNaFila } from '../dominio/pedido'
import type { ItemCardapio, Pedido } from '../dominio/tipos'
import type { CarrinhoHook } from '../hooks/useCarrinho'
import type { Navegacao } from '../hooks/useNavegacao'

type Props = {
  carrinho: CarrinhoHook
  navegacao: Navegacao
  meuPedido?: Pedido
  pedidos: Pedido[]
  aoAcompanhar: () => void
  aoAbrirCarrinho: () => void
}

export function TelaInicio({ carrinho, navegacao, meuPedido, pedidos, aoAcompanhar, aoAbrirCarrinho }: Props) {
  const { busca, categoria } = navegacao
  const itensVisiveis = filtrarItens(busca, categoria)
  const naFila = pedidos.filter(estaNaFila).length
  const quantidade = (item: ItemCardapio) => ({
    nome: item.nome,
    quantidade: carrinho.itens[item.id] ?? 0,
    aoAdicionar: () => carrinho.adicionar(item.id),
    aoRemover: () => carrinho.remover(item.id),
  })

  return (
    <>
      <Heroi aoPedir={carrinho.adicionar} />

      {meuPedido && meuPedido.status !== 'retirado' && (
        <button className="aviso-senha" onClick={aoAcompanhar}>
          <span>
            Sua senha <strong>{meuPedido.senha}</strong> · {meuPedido.status === 'pronto' ? 'pronto pra retirar!' : naFila + ' na fila agora'}
          </span>
          <span>Acompanhar →</span>
        </button>
      )}

      <section className="vitrine">
        <h2 className="titulo-secao">Mais pedidos</h2>
        <div className="vitrine-grade">
          {maisPedidos.map((item) => (
            <article key={item.id} className="destaque-card">
              <Foto src={'/assets/produtos/' + item.id + '.png'} alt={item.nome} classe="foto-destaque" dica="PNG recortado · 600×600" />
              <div className="destaque-corpo">
                <h3>{item.nome}</h3>
                <p>{item.descricao}</p>
                <hr />
                <strong className="destaque-preco">{formatarPreco(item.preco)}</strong>
                <BotaoQuantidade {...quantidade(item)} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="vitrine" id="cardapio">
        <h2 className="titulo-secao">Cardápio</h2>
        <input className="busca" type="search" placeholder="Buscar no cardápio…" value={busca} onChange={(e) => navegacao.buscar(e.target.value)} />

        {!busca.trim() && (
          <div className="categorias">
            {categorias.map((c) => (
              <button key={c.nome} className={'chip' + (c.nome === categoria ? ' ativo' : '')} onClick={() => navegacao.escolherCategoria(c.nome)}>
                {c.emoji} {c.nome}
              </button>
            ))}
          </div>
        )}

        <div className="grade">
          {itensVisiveis.map((item) => (
            <article key={item.id} className="card">
              <Foto src={'/assets/produtos/' + item.id + '.png'} alt={item.nome} classe="foto-card" dica="600×600" />
              <h3>{item.nome}</h3>
              <span className="preco">{formatarPreco(item.preco)}</span>
              <BotaoQuantidade {...quantidade(item)} />
            </article>
          ))}
          {itensVisiveis.length === 0 && <p className="vazio">Nada encontrado.</p>}
        </div>
      </section>

      <footer className="rodape">
        <span>Imperial Padaria · Quiosque Brum · CESAR School</span>
        <a href="#/balcao">Área do balcão →</a>
      </footer>

      {carrinho.resumo.quantidade > 0 && (
        <button className="barra-carrinho" onClick={aoAbrirCarrinho}>
          <span>
            {carrinho.resumo.quantidade} {carrinho.resumo.quantidade === 1 ? 'item' : 'itens'}
          </span>
          <strong>Ver pedido · {formatarPreco(carrinho.resumo.total)}</strong>
        </button>
      )}
    </>
  )
}

function Heroi({ aoPedir }: { aoPedir: (id: string) => void }) {
  const [slide, setSlide] = useState(0)
  const destaque = destaques[slide]
  const item = buscarItem(destaque.id)!
  const reais = Math.floor(item.preco)
  const centavos = Math.round((item.preco - reais) * 100)

  return (
    <>
      <section className="heroi">
        <h1 className="sr-only">Pula a fila</h1>
        <div className="heroi-titulo" aria-hidden="true">
          <svg viewBox="0 0 1000 250">
            <path id="arco-heroi" d="M 20 235 Q 500 95 980 235" fill="none" />
            <text>
              <textPath href="#arco-heroi" startOffset="50%" textAnchor="middle">
                PULA A FILA
              </textPath>
            </text>
          </svg>
          <span className="tag tag-lilas">Quentinho</span>
          <span className="tag tag-laranja">Sem fila</span>
        </div>

        <div className="heroi-grade">
          <div className="heroi-texto">
            <p className="display-texto">Salgados, tapiocas e café da manhã prontos no seu intervalo</p>
            <button className="botao-pessego" onClick={() => aoPedir(item.id)}>
              Pedir agora
            </button>
          </div>

          <div className="heroi-foto">
            <Foto src={'/assets/hero/' + item.id + '.png'} alt={item.nome} classe="foto-heroi" dica="PNG recortado, sem fundo · 800×1000" />
          </div>

          <div className="heroi-preco">
            <div className="etiqueta-heroi">
              <strong className="preco-grande">
                <span className="moeda">R$</span>
                {reais}
                {centavos > 0 && <sup>,{String(centavos).padStart(2, '0')}</sup>}
              </strong>
              <span className="etiqueta-nome">{item.nome}</span>
              <small>{destaque.rotulo}</small>
            </div>
          </div>
        </div>
      </section>

      <div className="carrossel">
        <div className="carrossel-setas">
          <button aria-label="Destaque anterior" onClick={() => setSlide((slide + destaques.length - 1) % destaques.length)}>
            ←
          </button>
          <button aria-label="Próximo destaque" onClick={() => setSlide((slide + 1) % destaques.length)}>
            →
          </button>
        </div>
        <div className="carrossel-pontos">
          {destaques.map((d, i) => (
            <button key={d.id} aria-label={'Destaque ' + (i + 1)} className={i === slide ? 'ativo' : ''} onClick={() => setSlide(i)} />
          ))}
        </div>
      </div>
    </>
  )
}
