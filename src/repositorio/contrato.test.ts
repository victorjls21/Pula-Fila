import { describe, expect, it, vi } from 'vitest'
import type { Pedido } from '../dominio/tipos'
import { LocalStoragePedidoRepositorio, LocalStorageSessaoCliente } from './LocalStoragePedidoRepositorio'
import { MemoriaPedidoRepositorio, MemoriaSessaoCliente } from './MemoriaPedidoRepositorio'
import type { PedidoRepositorio, SessaoCliente } from './PedidoRepositorio'

/** Storage mínimo, para testar a implementação de localStorage fora do navegador. */
class StorageFalso implements Storage {
  private dados = new Map<string, string>()
  get length() {
    return this.dados.size
  }
  clear() {
    this.dados.clear()
  }
  getItem(chave: string) {
    return this.dados.get(chave) ?? null
  }
  key(i: number) {
    return [...this.dados.keys()][i] ?? null
  }
  removeItem(chave: string) {
    this.dados.delete(chave)
  }
  setItem(chave: string, valor: string) {
    this.dados.set(chave, valor)
  }
}

const pedido = (senha: string, extra: Partial<Pedido> = {}): Pedido => ({
  senha,
  cliente: 'Ana',
  itens: [{ id: 'coxinha-frango', nome: 'Coxinha de frango', preco: 12, qtd: 1 }],
  total: 12,
  pagamento: 'Pix',
  retirada: 'Assim que ficar pronto',
  status: 'recebido',
  criadoEm: 1,
  ...extra,
})

// Liskov: toda implementação de PedidoRepositorio precisa passar pelo mesmo contrato.
describe.each<[string, () => PedidoRepositorio]>([
  ['MemoriaPedidoRepositorio', () => new MemoriaPedidoRepositorio()],
  ['LocalStoragePedidoRepositorio', () => new LocalStoragePedidoRepositorio(new StorageFalso())],
])('contrato de PedidoRepositorio: %s', (_nome, criar) => {
  it('começa vazio', () => {
    expect(criar().listar()).toEqual([])
  })

  it('adiciona pedidos na ordem de chegada', () => {
    const repo = criar()
    repo.adicionar(pedido('A-001'))
    repo.adicionar(pedido('A-002'))
    expect(repo.listar().map((p) => p.senha)).toEqual(['A-001', 'A-002'])
  })

  it('atualiza só o pedido de mesma senha', () => {
    const repo = criar()
    repo.adicionar(pedido('A-001'))
    repo.adicionar(pedido('A-002'))
    repo.atualizar(pedido('A-002', { status: 'preparo' }))
    expect(repo.listar().map((p) => p.status)).toEqual(['recebido', 'preparo'])
  })

  it('numera senhas em sequência e reinicia ao limpar', () => {
    const repo = criar()
    expect([repo.proximoNumeroSenha(), repo.proximoNumeroSenha()]).toEqual([1, 2])
    repo.adicionar(pedido('A-001'))
    repo.limpar()
    expect(repo.listar()).toEqual([])
    expect(repo.proximoNumeroSenha()).toBe(1)
  })

  it('avisa os observadores a cada mudança e para de avisar após cancelar', () => {
    const repo = criar()
    const aoMudar = vi.fn()
    const cancelar = repo.observar(aoMudar)
    repo.adicionar(pedido('A-001'))
    expect(aoMudar).toHaveBeenLastCalledWith([pedido('A-001')])
    cancelar()
    repo.limpar()
    expect(aoMudar).toHaveBeenCalledTimes(1)
  })

  it('não deixa quem chama alterar a lista interna', () => {
    const repo = criar()
    repo.adicionar(pedido('A-001'))
    repo.listar().push(pedido('A-999'))
    expect(repo.listar()).toHaveLength(1)
  })
})

describe.each<[string, () => SessaoCliente]>([
  ['MemoriaSessaoCliente', () => new MemoriaSessaoCliente()],
  ['LocalStorageSessaoCliente', () => new LocalStorageSessaoCliente(new StorageFalso())],
])('contrato de SessaoCliente: %s', (_nome, criar) => {
  it('guarda nome e senha acompanhada', () => {
    const sessao = criar()
    expect([sessao.nome(), sessao.minhaSenha()]).toEqual(['', ''])
    sessao.salvarNome('Ana')
    sessao.salvarMinhaSenha('A-007')
    expect([sessao.nome(), sessao.minhaSenha()]).toEqual(['Ana', 'A-007'])
  })
})

describe('LocalStoragePedidoRepositorio', () => {
  it('lê os pedidos gravados pela versão go-horse (mesmas chaves)', () => {
    const storage = new StorageFalso()
    storage.setItem('pedidos', JSON.stringify([pedido('A-010')]))
    storage.setItem('contadorSenha', '10')
    const repo = new LocalStoragePedidoRepositorio(storage)
    expect(repo.listar()[0].senha).toBe('A-010')
    expect(repo.proximoNumeroSenha()).toBe(11)
  })

  it('trata conteúdo corrompido como lista vazia', () => {
    const storage = new StorageFalso()
    storage.setItem('pedidos', '{não é json')
    expect(new LocalStoragePedidoRepositorio(storage).listar()).toEqual([])
  })
})
