// Mede LOC e complexidade ciclomática da versão go-horse (metricas/antes) e da atual (src).
// Uso: npm run metricas
// Complexidade e linhas por função vêm das regras `complexity` e `max-lines-per-function` do oxlint
// (mesma contagem do ESLint: if, else if, ?:, &&, ||, ??, laços e catch somam 1 cada).

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const config = join(raiz, 'metricas/oxlint-metricas.json')
const ehCodigo = (f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith('.d.ts')

function arquivos(caminho) {
  if (statSync(caminho).isFile()) return [caminho]
  return readdirSync(caminho).flatMap((n) => arquivos(join(caminho, n))).filter(ehCodigo)
}

function locDe(arquivo) {
  return readFileSync(arquivo, 'utf8').split('\n').filter((l) => l.trim() !== '').length
}

/** Lê a saída do oxlint e devolve uma entrada por função: arquivo, linha, nome, complexidade e linhas. */
function funcoes(lista) {
  let saida = ''
  try {
    execFileSync('npx', ['oxlint', '-c', config, '--format', 'unix', ...lista], { cwd: raiz, encoding: 'utf8' })
  } catch (e) {
    saida = e.stdout // o oxlint sai com código 1 porque todo limite é 1
  }
  const porLocal = new Map()
  for (const linha of saida.split('\n')) {
    // Ex.: "src/a.ts:49:24: async method `finalizarPedido` has a complexity of 2."
    const m = linha.match(
      /^(.+?):(\d+):\d+: (?:The )?(?:(?:async|private|protected|public|static|get|set) )*(?:function|method|constructor)(?: `([^`]+)`)? has (?:a complexity of (\d+)|too many lines \((\d+)\))/,
    )
    if (!m) continue
    const [, arquivo, num, nome, cc, linhas] = m
    const chave = arquivo + ':' + num
    const f = porLocal.get(chave) ?? { arquivo: relative(raiz, join(raiz, arquivo)), linha: Number(num), nome: nome ?? '(anônima)', cc: 1, linhas: 1 }
    if (cc) f.cc = Number(cc)
    if (linhas) f.linhas = Number(linhas)
    porLocal.set(chave, f)
  }
  return [...porLocal.values()]
}

function medir(rotulo, caminho) {
  const lista = arquivos(join(raiz, caminho)).map((f) => relative(raiz, f))
  const fs = funcoes(lista)
  const loc = lista.reduce((s, f) => s + locDe(join(raiz, f)), 0)
  const ccs = fs.map((f) => f.cc)
  return {
    rotulo,
    arquivos: lista.length,
    loc,
    funcoes: fs,
    ccMax: Math.max(...ccs),
    ccMedia: ccs.reduce((s, c) => s + c, 0) / ccs.length,
    maiorArquivo: Math.max(...lista.map((f) => locDe(join(raiz, f)))),
  }
}

const antes = medir('Antes (go-horse)', 'metricas/antes')
const depois = medir('Depois (v2)', 'src')

const linha = (...c) => '| ' + c.join(' | ') + ' |'
console.log('## Visão geral\n')
console.log(linha('Métrica', antes.rotulo, depois.rotulo))
console.log(linha('---', '---:', '---:'))
console.log(linha('Arquivos .ts/.tsx (sem testes)', antes.arquivos, depois.arquivos))
console.log(linha('LOC (linhas não vazias)', antes.loc, depois.loc))
console.log(linha('Maior arquivo (LOC)', antes.maiorArquivo, depois.maiorArquivo))
console.log(linha('Funções', antes.funcoes.length, depois.funcoes.length))
console.log(linha('Complexidade máxima', antes.ccMax, depois.ccMax))
console.log(linha('Complexidade média', antes.ccMedia.toFixed(2), depois.ccMedia.toFixed(2)))

// O fluxo de finalizar pedido: antes, uma função + o callback do setTimeout; depois, as peças que a substituem.
const fluxoAntes = antes.funcoes.filter((f) => f.nome === 'finalizarPedido' || (f.linha > 157 && f.linha < 220))
const pecasDepois = ['finalizarPedido', 'validar', 'montarPedido', 'pagar']
const fluxoDepois = depois.funcoes.filter((f) => pecasDepois.includes(f.nome))
const soma = (fs, k) => fs.reduce((s, f) => s + f[k], 0)

console.log('\n## Fluxo de finalizar pedido\n')
console.log(linha('Versão', 'Função', 'Arquivo', 'Linhas', 'Complexidade'))
console.log(linha('---', '---', '---', '---:', '---:'))
for (const f of fluxoAntes) console.log(linha('Antes', '`' + f.nome + '`', f.arquivo, f.linhas, f.cc))
for (const f of fluxoDepois) console.log(linha('Depois', '`' + f.nome + '`', f.arquivo, f.linhas, f.cc))
console.log(linha('**Antes**', 'maior função', '', Math.max(...fluxoAntes.map((f) => f.linhas)), Math.max(...fluxoAntes.map((f) => f.cc))))
console.log(linha('**Depois**', 'maior função', '', Math.max(...fluxoDepois.map((f) => f.linhas)), Math.max(...fluxoDepois.map((f) => f.cc))))
// Cada função soma 1 de base; os pontos de decisão (Σ CC − 1) mostram quanta lógica existe no fluxo.
const decisoes = (fs) => soma(fs, 'cc') - fs.length
console.log(linha('Antes', 'soma das linhas · pontos de decisão', '', soma(fluxoAntes, 'linhas'), decisoes(fluxoAntes)))
console.log(linha('Depois', 'soma das linhas · pontos de decisão', '', soma(fluxoDepois, 'linhas'), decisoes(fluxoDepois)))

console.log('\n## 5 funções mais complexas\n')
for (const v of [antes, depois]) {
  const top = [...v.funcoes].sort((a, b) => b.cc - a.cc).slice(0, 5)
  console.log('**' + v.rotulo + '**: ' + top.map((f) => '`' + f.nome + '` ' + f.cc + ' (' + f.arquivo + ')').join(', ') + '\n')
}
