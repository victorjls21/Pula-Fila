import { nomeParticipante, type CotaDivisao, type ItemUnitario } from '../divisao'
import { formatarPreco } from '../dominio/dinheiro'
import type { ItemPedido } from '../dominio/tipos'
import type { DivisaoHook } from '../hooks/useDivisao'

type Props = {
  itens: ItemPedido[]
  nomePrincipal: string
  aoMudarNomePrincipal: (nome: string) => void
  divisao: DivisaoHook
}

type PropsUnidades = {
  unidades: ItemUnitario[]
  nomes: string[]
  donoPorUnidade: Record<string, number>
  aoAtribuir: (chave: string, indice: number) => void
}

function EscolherDonosPorItem({ unidades, nomes, donoPorUnidade, aoAtribuir }: PropsUnidades) {
  return (
    <div className="racha-itens">
      <p className="suave pequeno">Quem pediu cada item?</p>
      {unidades.map((u) => {
        const dono = donoPorUnidade[u.chave] ?? 0
        const donoSeguro = dono >= 0 && dono < nomes.length ? dono : 0
        return (
          <div key={u.chave} className="racha-item-linha">
            <span>
              {u.rotulo} <strong>({formatarPreco(u.preco)})</strong>
            </span>
            <div className="racha-chips">
              {nomes.map((nome, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={'chip pequeno' + (donoSeguro === idx ? ' ativo' : '')}
                  onClick={() => aoAtribuir(u.chave, idx)}
                >
                  {nome}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

type PropsColegas = {
  cotas: CotaDivisao[]
  participantes: string[]
  nomePrincipal: string
  aoMudarNomePrincipal: (nome: string) => void
  divisao: DivisaoHook
}

function ListaColegas({ cotas, participantes, nomePrincipal, aoMudarNomePrincipal, divisao }: PropsColegas) {
  return (
    <div className="racha-colegas">
      {cotas.map((cota, idx) => (
        <div key={idx} className="racha-colega">
          <input
            aria-label={`Nome da pessoa ${idx + 1}`}
            placeholder={idx === 0 ? 'Seu nome' : `Colega ${idx + 1}`}
            value={idx === 0 ? nomePrincipal : participantes[idx]}
            onChange={(e) => (idx === 0 ? aoMudarNomePrincipal(e.target.value) : divisao.renomear(idx, e.target.value))}
          />
          <span className="etiqueta-preco">{formatarPreco(cota.valor)}</span>
          {participantes.length > 2 && idx > 0 && (
            <button type="button" className="racha-remover" title="Remover colega" onClick={() => divisao.removerColega(idx)}>
              ✕
            </button>
          )}
        </div>
      ))}
      {participantes.length < 6 && (
        <button type="button" className="botao contorno pequeno" onClick={divisao.adicionarColega}>
          + Adicionar colega
        </button>
      )}
    </div>
  )
}

export function RacharPedido({ itens, nomePrincipal, aoMudarNomePrincipal, divisao }: Props) {
  if (itens.length === 0) return null
  const cotas = divisao.cotasDe(itens, nomePrincipal)
  const nomes = divisao.participantes.map((n, i) => (i === 0 ? nomePrincipal.trim() || 'Você' : nomeParticipante(n, i)))

  return (
    <div className="racha-box">
      <div className="racha-topo">
        <strong>👥 Dividir conta?</strong>
        <div className="racha-chips">
          <button type="button" className={'chip' + (!divisao.ativa ? ' ativo' : '')} onClick={() => divisao.alternar(false, nomePrincipal)}>
            👤 Só pra mim
          </button>
          <button type="button" className={'chip' + (divisao.ativa ? ' ativo' : '')} onClick={() => divisao.alternar(true, nomePrincipal)}>
            👥 Rachar com colegas
          </button>
        </div>
      </div>

      {divisao.ativa && (
        <div className="racha-corpo">
          <div className="racha-chips">
            {divisao.estrategias.map((e) => (
              <button
                key={e.id}
                type="button"
                className={'chip' + (e.id === divisao.estrategia.id ? ' ativo' : '')}
                onClick={() => divisao.setEstrategiaId(e.id)}
              >
                {e.nome}
              </button>
            ))}
          </div>
          <p className="suave pequeno">{divisao.estrategia.descricao}</p>

          <ListaColegas
            cotas={cotas}
            participantes={divisao.participantes}
            nomePrincipal={nomePrincipal}
            aoMudarNomePrincipal={aoMudarNomePrincipal}
            divisao={divisao}
          />

          {divisao.estrategia.exigeEscolhaPorItem && (
            <EscolherDonosPorItem
              unidades={divisao.unidadesDe(itens)}
              nomes={nomes}
              donoPorUnidade={divisao.donoPorUnidade}
              aoAtribuir={divisao.atribuirUnidade}
            />
          )}
        </div>
      )}
    </div>
  )
}

