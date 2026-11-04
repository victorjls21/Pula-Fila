# Cantina CESAR · Pula a Fila

> FDS 2026.2 · Hackathon Relâmpago #1 · Entrega 2

Web-app para acabar com a fila da cantina da CESAR School (Imperial Padaria). O aluno faz o pedido antecipado pelo celular, paga pelo app e recebe uma **senha**. O balcão acompanha os pedidos num quadro e avisa quando a senha está pronta. Os 15 minutos do intervalo ficam para comer.

## Funcionalidades
- Cardápio real da Imperial (44 itens em 8 categorias), com busca
- Carrinho e escolha do horário de retirada
- Pagamento simulado: Pix ou cartão (com validação)
- Senha de retirada (`A-001`, `A-002`…) e posição na fila
- Tela do balcão: Recebidos → Em preparo → Prontos → Entregue
- Aviso de "pedido pronto" no celular do aluno, em tempo real

## Como rodar
```bash
npm install
npm run dev        # app em http://localhost:5173
npm test           # testes (Vitest)
npm run metricas   # LOC e complexidade: go-horse × v2
npm run lint
```
Abra `http://localhost:5173` (aluno) e, **em outra aba**, `http://localhost:5173/#/balcao` (balcão). As abas se sincronizam sozinhas.

## Arquitetura (v2)

```
src/
├── dominio/       regras puras, sem React: tipos, pedido (transições de status), carrinho, cardápio, horários
├── pagamento/     Strategy: interface MeioPagamento + Pix + Cartao
├── repositorio/   interface PedidoRepositorio/SessaoCliente + implementações localStorage e memória
├── servicos/      PedidoService (finalizar, avançar status, zerar dia) + criarServicos (raiz de composição)
├── hooks/         usePedidos, useCarrinho, useCheckout, useMeuPedido, useNavegacao, contexto de serviços
├── componentes/   Cabecalho, Foto, BotaoQuantidade
├── telas/         TelaInicio, TelaCarrinho, TelaPagamento, TelaSenha, TelaBalcao
└── App.tsx        só escolhe a tela e liga os hooks
```

Dependências apontam para dentro: `telas → hooks → servicos → dominio`. As telas não importam nenhuma implementação de armazenamento. O único lugar que escolhe `localStorage` é `criarServicos()` (`src/servicos/servicos.ts`), injetado pelo `ServicosContext` em `main.tsx`. Para trocar o armazenamento (memória, API, Firebase), basta passar outro `PedidoRepositorio` para `criarServicos()`, sem mexer nas telas.

## Decisões de stack
- **React + TypeScript + Vite**: setup em segundos, e o TypeScript deixa tipos e interfaces explícitos.
- **Sem backend e sem banco**, como o enunciado permite: os pedidos ficam no `localStorage`, atrás de `PedidoRepositorio`. O evento `storage` sincroniza as abas do aluno e do balcão.
- **Cardápio em JSON** (`src/cardapio.json`), transcrito das fotos do cardápio físico. Emojis das categorias, destaques do carrossel e "mais pedidos" também moram lá.
- **Vitest** para os testes, **oxlint** para lint e para as métricas de complexidade.

## Integrantes
| Nome | Papel |
|---|---|
| _preencher_ | _preencher_ |

## Princípios do cap. 5: antes e depois

A Entrega 1 era **go-horse de propósito**: tudo num único componente `App` (673 linhas). A cópia fica em `metricas/antes/App.tsx` para a comparação ser reproduzível.

| Antes (função em `metricas/antes/App.tsx`) | Princípio violado | Como a v2 resolve |
|---|---|---|
| `App` | Responsabilidade Única · Coesão (LCOM alto) | Uma tela por componente em `telas/`; estado em hooks; regras em `dominio/` e `servicos/` |
| `useEffect` de `storage` + `salvarPedidos` | Ocultamento de informação · Inversão de Dependências | `PedidoRepositorio` (interface) com `LocalStoragePedidoRepositorio` e `MemoriaPedidoRepositorio`, injetados via `ServicosContext` |
| `emoji` | Aberto/Fechado | O emoji é dado da categoria em `cardapio.json`; `emojiDaCategoria` só consulta |
| cálculo de `totalCarrinho` no corpo de `App` | Demeter · SRP | `resumirCarrinho` (`dominio/carrinho.ts`) devolve itens, total e quantidade |
| `finalizarPedido` | Aberto/Fechado · SRP · complexidade ciclomática | `PedidoService.finalizarPedido` orquestra; `validar` e `montarPedido` separados; cada meio de pagamento valida a si mesmo (Strategy). Novo meio = nova classe em `pagamento/` |
| `avancarStatus` | Ocultamento de informação | Status é o tipo `StatusPedido`; só `avancar` (`dominio/pedido.ts`) muda de etapa, seguindo a tabela `PROXIMO_STATUS` |
| `destaques` / `maisPedidos` soltos no componente | Integridade conceitual | Movidos para `cardapio.json` |

### Métricas (`npm run metricas`)

Complexidade ciclomática e linhas por função vêm das regras `complexity` e `max-lines-per-function` do oxlint (mesma contagem do ESLint). LOC = linhas não vazias, sem contar testes.

| Métrica | Antes (go-horse) | Depois (v2) |
| --- | ---: | ---: |
| Arquivos .ts/.tsx | 1 | 32 |
| LOC | 632 | 1169 |
| Maior arquivo (LOC) | 632 | 157 |
| Complexidade máxima de uma função | 40 (`App`) | 8 (`TelaInicio`, `TelaPagamento`) |
| Complexidade média por função | 3,58 | 1,87 |

**Fluxo de finalizar pedido**

| Versão | Função | Linhas | Complexidade |
| --- | --- | ---: | ---: |
| Antes | `finalizarPedido` | 64 | 8 |
| Antes | callback do `setTimeout` dentro dele | 31 | 5 |
| Depois | `PedidoService.finalizarPedido` | 8 | 2 |
| Depois | `PedidoService.validar` | 7 | 4 |
| Depois | `PedidoService.montarPedido` | 13 | 1 |
| Depois | `Cartao.validar` | 6 | 4 |
| Depois | `Pix.validar` | 3 | 1 |
| Depois | `useCheckout.pagar` | 19 | 2 |
| Depois | `App.pagar` | 7 | 2 |

Leitura dos números:
- A maior função do fluxo caiu de **64 linhas / complexidade 8** para **19 linhas / complexidade 4**, e `finalizarPedido` em si foi de **8 para 2**.
- A lógica não sumiu: são 11 pontos de decisão antes e 9 depois. Ela foi **distribuída** em funções pequenas, cada uma testável sozinha.
- O LOC total **subiu** (632 → 1169). É o custo de interfaces, tipos, imports e duas implementações de repositório. Em troca, nenhum arquivo passa de 157 linhas e a regra de negócio tem 40 testes.

### Testes (`npm test`)
- `repositorio/contrato.test.ts`: **teste de contrato (Liskov)**. A mesma bateria roda contra `MemoriaPedidoRepositorio` e `LocalStoragePedidoRepositorio`, e as duas precisam se comportar igual. Também confere a compatibilidade com os dados gravados pela versão go-horse.
- `servicos/PedidoService.test.ts`: finalizar (sucesso, senhas em sequência, cada erro de validação), transições do balcão, zerar dia.
- `dominio/dominio.test.ts`: carrinho, regras do pedido, cardápio e horários de retirada.

### Dívidas que continuam
- `TelaInicio` e `TelaPagamento` têm complexidade 8, vinda dos condicionais de JSX.
- Depois de "Zerar dia", a senha guardada no celular do aluno pode coincidir com um pedido novo de mesmo número.
- O balcão não tem autenticação: qualquer um que abra `#/balcao` muda pedidos.
