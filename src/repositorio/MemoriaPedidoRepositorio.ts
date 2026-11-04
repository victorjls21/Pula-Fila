import type { Pedido } from '../dominio/tipos'
import type { Cancelar, PedidoRepositorio, SessaoCliente } from './PedidoRepositorio'

/** Guarda tudo em memória. Serve para testes e para provar que a troca de armazenamento não afeta as telas. */
export class MemoriaPedidoRepositorio implements PedidoRepositorio {
  private pedidos: Pedido[] = []
  private contador = 0
  private readonly ouvintes = new Set<(pedidos: Pedido[]) => void>()

  listar(): Pedido[] {
    return [...this.pedidos]
  }

  adicionar(pedido: Pedido): void {
    this.mudar([...this.pedidos, pedido])
  }

  atualizar(pedido: Pedido): void {
    this.mudar(this.pedidos.map((p) => (p.senha === pedido.senha ? pedido : p)))
  }

  limpar(): void {
    this.contador = 0
    this.mudar([])
  }

  proximoNumeroSenha(): number {
    this.contador += 1
    return this.contador
  }

  observar(aoMudar: (pedidos: Pedido[]) => void): Cancelar {
    this.ouvintes.add(aoMudar)
    return () => this.ouvintes.delete(aoMudar)
  }

  private mudar(pedidos: Pedido[]): void {
    this.pedidos = pedidos
    for (const ouvinte of this.ouvintes) ouvinte(this.listar())
  }
}

export class MemoriaSessaoCliente implements SessaoCliente {
  private nomeAtual = ''
  private senhaAtual = ''

  nome(): string {
    return this.nomeAtual
  }

  salvarNome(nome: string): void {
    this.nomeAtual = nome
  }

  minhaSenha(): string {
    return this.senhaAtual
  }

  salvarMinhaSenha(senha: string): void {
    this.senhaAtual = senha
  }
}
