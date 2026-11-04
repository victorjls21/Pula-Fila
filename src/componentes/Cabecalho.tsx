const ATALHOS = ['Salgados', 'Tapiocas', 'Croissant', 'Sobremesas', 'Bebidas']

type Props = {
  quantidade: number
  aoEscolherCategoria: (categoria?: string) => void
  aoAbrirCarrinho: () => void
}

export function Cabecalho({ quantidade, aoEscolherCategoria, aoAbrirCarrinho }: Props) {
  return (
    <header className="topo">
      <a href="#/" className="marca">
        <img src="/logo.png" alt="Imperial Padaria" />
      </a>
      <nav className="menu">
        {ATALHOS.map((c) => (
          <button key={c} onClick={() => aoEscolherCategoria(c)}>
            {c}
          </button>
        ))}
      </nav>
      <div className="acoes">
        <button className="botao-contorno" onClick={() => aoEscolherCategoria()}>
          Ver cardápio
        </button>
        <button className="botao-contorno icone" aria-label={'Carrinho com ' + quantidade + ' itens'} onClick={aoAbrirCarrinho}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
            <path d="M2 3h3l2.6 12.2a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.5-1.1L21 8H6" />
          </svg>
          {quantidade > 0 && <span className="badge">{quantidade}</span>}
        </button>
      </div>
    </header>
  )
}
