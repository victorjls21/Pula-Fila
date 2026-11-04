import { emojiDaCategoria } from '../dominio/cardapio'
import { formatarPreco } from '../dominio/dinheiro'
import { useCombos } from '../hooks/useCombos'
import { ORCAMENTOS, TEMPOS_DISPONIVEIS, type Combo } from '../sugestao'

type Props = { naFila: number; aoEscolher: (combo: Combo) => void }

type Opcao = { valor: string; rotulo: string }

function Filtro({ titulo, opcoes, atual, aoEscolher }: { titulo: string; opcoes: Opcao[]; atual: string; aoEscolher: (valor: string) => void }) {
  return (
    <div className="combo-filtro" role="group" aria-label={titulo}>
      <span className="combo-filtro-titulo">{titulo}</span>
      <div className="combo-chips">
        {opcoes.map((o) => (
          <button key={o.valor} className={'chip' + (o.valor === atual ? ' ativo' : '')} aria-pressed={o.valor === atual} onClick={() => aoEscolher(o.valor)}>
            {o.rotulo}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MonteSeuCombo({ naFila, aoEscolher }: Props) {
  const combos = useCombos(naFila)

  return (
    <section className="vitrine combo" id="combo">
      <h2 className="titulo-secao">Monte seu combo do intervalo</h2>
      <p className="combo-intro">Diz quanto tem no bolso e quanto falta pro intervalo acabar. A gente monta o combo que cabe.</p>

      <div className="combo-filtros">
        <Filtro
          titulo="No bolso"
          opcoes={ORCAMENTOS.map((v) => ({ valor: String(v), rotulo: 'até R$ ' + v }))}
          atual={String(combos.orcamento)}
          aoEscolher={(v) => combos.setOrcamento(Number(v))}
        />
        <Filtro
          titulo="Pronto em"
          opcoes={TEMPOS_DISPONIVEIS.map((v) => ({ valor: String(v), rotulo: 'até ' + v + ' min' }))}
          atual={String(combos.minutos)}
          aoEscolher={(v) => combos.setMinutos(Number(v))}
        />
        <Filtro
          titulo="Do jeito"
          opcoes={combos.estrategias.map((e) => ({ valor: e.id, rotulo: e.nome }))}
          atual={combos.estrategia.id}
          aoEscolher={combos.setEstrategiaId}
        />
      </div>

      <p className="combo-nota suave pequeno">
        {combos.estrategia.descricao}
        {naFila > 0 && ' O tempo já conta ' + naFila + (naFila === 1 ? ' pedido' : ' pedidos') + ' na fila.'}
      </p>

      {combos.sugestoes.length === 0 ? (
        <p className="vazio">
          Nenhum combo desse jeito cabe em R$ {combos.orcamento} e {combos.minutos} min. Tenta aumentar o bolso ou o tempo.
        </p>
      ) : (
        <div className="combo-grade">
          {combos.sugestoes.map((combo) => (
            <article key={combo.id} className="combo-card">
              <p className="combo-chamada">
                {formatarPreco(combo.preco)} e pronto em {combo.minutos} min
              </p>
              <ul className="combo-itens">
                {combo.itens.map((item) => (
                  <li key={item.id}>
                    <span>
                      {emojiDaCategoria(item.categoria)} {item.nome}
                    </span>
                    <span className="suave">{formatarPreco(item.preco)}</span>
                  </li>
                ))}
              </ul>
              <button className="botao primario cheio" onClick={() => aoEscolher(combo)}>
                Quero esse combo
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
