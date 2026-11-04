import type { Pedido } from '../dominio/tipos'
import type { Cancelar, PedidoRepositorio, SessaoCliente } from './PedidoRepositorio'

// Mesmas chaves da versão go-horse, para não perder pedidos já gravados no navegador.
const CHAVE_PEDIDOS = 'pedidos'
const CHAVE_CONTADOR = 'contadorSenha'
const CHAVE_NOME = 'nomeCliente'
const CHAVE_MINHA_SENHA = 'minhaSenha'

function lerLista(texto: string | null): Pedido[] {
  try {
    const valor: unknown = JSON.parse(texto ?? '[]')
    return Array.isArray(valor) ? (valor as Pedido[]) : []
  } catch {
    return []
  }
}

export class LocalStoragePedidoRepositorio implements PedidoRepositorio {
  private readonly armazenamento: Storage
  private readonly ouvintes = new Set<(pedidos: Pedido[]) => void>()

  constructor(armazenamento: Storage) {
    this.armazenamento = armazenamento
  }

  listar(): Pedido[] {
    return lerLista(this.armazenamento.getItem(CHAVE_PEDIDOS))
  }

  adicionar(pedido: Pedido): void {
    this.gravar([...this.listar(), pedido])
  }

  atualizar(pedido: Pedido): void {
    this.gravar(this.listar().map((p) => (p.senha === pedido.senha ? pedido : p)))
  }

  limpar(): void {
    this.armazenamento.removeItem(CHAVE_CONTADOR)
    this.gravar([])
  }

  proximoNumeroSenha(): number {
    const numero = Number(this.armazenamento.getItem(CHAVE_CONTADOR) ?? '0') + 1
    this.armazenamento.setItem(CHAVE_CONTADOR, String(numero))
    return numero
  }

  observar(aoMudar: (pedidos: Pedido[]) => void): Cancelar {
    // Mudanças desta aba chegam pelos ouvintes; as de outras abas, pelo evento `storage`.
    const aoMudarOutraAba = (e: StorageEvent) => {
      if (e.key === CHAVE_PEDIDOS || e.key === null) aoMudar(this.listar())
    }
    this.ouvintes.add(aoMudar)
    if (typeof window !== 'undefined') window.addEventListener('storage', aoMudarOutraAba)
    return () => {
      this.ouvintes.delete(aoMudar)
      if (typeof window !== 'undefined') window.removeEventListener('storage', aoMudarOutraAba)
    }
  }

  private gravar(pedidos: Pedido[]): void {
    this.armazenamento.setItem(CHAVE_PEDIDOS, JSON.stringify(pedidos))
    for (const ouvinte of this.ouvintes) ouvinte(pedidos)
  }
}

export class LocalStorageSessaoCliente implements SessaoCliente {
  private readonly armazenamento: Storage

  constructor(armazenamento: Storage) {
    this.armazenamento = armazenamento
  }

  nome(): string {
    return this.armazenamento.getItem(CHAVE_NOME) ?? ''
  }

  salvarNome(nome: string): void {
    this.armazenamento.setItem(CHAVE_NOME, nome)
  }

  minhaSenha(): string {
    return this.armazenamento.getItem(CHAVE_MINHA_SENHA) ?? ''
  }

  salvarMinhaSenha(senha: string): void {
    this.armazenamento.setItem(CHAVE_MINHA_SENHA, senha)
  }
}
