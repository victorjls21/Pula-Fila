type Props = {
  nome: string
  quantidade: number
  aoAdicionar: () => void
  aoRemover: () => void
}

export function Passo({ nome, quantidade, aoAdicionar, aoRemover }: Props) {
  return (
    <span className="passo">
      <button aria-label={'Tirar um ' + nome} onClick={aoRemover}>
        −
      </button>
      {quantidade}
      <button aria-label={'Mais um ' + nome} onClick={aoAdicionar}>
        +
      </button>
    </span>
  )
}

/** Botão "Adicionar" enquanto o item não está no carrinho; depois, o controle − / +. */
export function BotaoQuantidade(props: Props) {
  if (props.quantidade > 0) return <Passo {...props} />
  return (
    <button className="botao-card" onClick={props.aoAdicionar}>
      Adicionar
    </button>
  )
}
