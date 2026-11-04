import { useEffect, useState } from 'react'
import { categorias } from '../dominio/cardapio'
import { definirHash, lerHash, rolarAte, ROTA_BALCAO } from './navegador'

export type Tela = 'cardapio' | 'carrinho' | 'pagamento' | 'senha'

export type Navegacao = {
  ehBalcao: boolean
  tela: Tela
  irPara: (tela: Tela) => void
  categoria: string
  escolherCategoria: (categoria: string) => void
  busca: string
  buscar: (texto: string) => void
  irParaCardapio: (categoria?: string) => void
}

/** Rota do hash (aluno × balcão) + tela atual do aluno + filtro do cardápio. */
export function useNavegacao(): Navegacao {
  const [hash, setHash] = useState(lerHash)
  const [tela, setTela] = useState<Tela>('cardapio')
  const [categoria, setCategoria] = useState(categorias[0].nome)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    const aoMudarHash = () => setHash(lerHash())
    window.addEventListener('hashchange', aoMudarHash)
    return () => window.removeEventListener('hashchange', aoMudarHash)
  }, [])

  const ehBalcao = hash === ROTA_BALCAO

  function irPara(destino: Tela) {
    if (ehBalcao) definirHash('#/')
    setTela(destino)
  }

  function irParaCardapio(novaCategoria?: string) {
    irPara('cardapio')
    setBusca('')
    if (novaCategoria) setCategoria(novaCategoria)
    rolarAte('cardapio')
  }

  return { ehBalcao, tela, irPara, categoria, escolherCategoria: setCategoria, busca, buscar: setBusca, irParaCardapio }
}
