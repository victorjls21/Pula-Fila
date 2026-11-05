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
- **Monte seu combo do intervalo**: o aluno diz quanto tem no bolso e em quanto tempo precisa do lanche, e o app sugere combos como "R$ 14,50 e pronto em 2 min"
- **Rachar pedido com colegas**: na tela "Seu pedido", o grupo escolhe dividir igualmente ou por item que cada colega pediu (Strategy), e no pagamento cada colega escolhe seu próprio meio (Pix ou Cartão) e paga sua parte
- **Balcão que fala**: quando um pedido fica pronto, o painel anuncia em voz alta "Senha A 42, Tales! Coxinha de frango e Suco Recife saindo!"

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
├── divisao/       Strategy: interface EstrategiaDivisao + DivisaoIgualitaria + DivisaoPorItem
├── repositorio/   interface PedidoRepositorio/SessaoCliente + implementações localStorage e memória
├── sugestao/      Strategy: interface EstrategiaSugestao + 4 estratégias de combo + geração e filtro de combos
├── voz/           texto do anúncio (puro) + interface Anunciador com a voz do navegador
├── servicos/      PedidoService (finalizar, avançar status, zerar dia) + criarServicos (raiz de composição)
├── hooks/         usePedidos, useCarrinho, useCheckout, useDivisao, useMeuPedido, useNavegacao, useCombos, useAnuncioBalcao
├── componentes/   Cabecalho, Foto, BotaoQuantidade, MonteSeuCombo, RacharPedido, PagamentoRachado
├── telas/         TelaInicio, TelaCarrinho, TelaPagamento, TelaSenha, TelaBalcao
└── App.tsx        só escolhe a tela e liga os hooks
```

Dependências apontam para dentro: `telas → hooks → servicos → dominio`. As telas não importam nenhuma implementação de armazenamento. O único lugar que escolhe `localStorage` é `criarServicos()` (`src/servicos/servicos.ts`), injetado pelo `ServicosContext` em `main.tsx`. Para trocar o armazenamento (memória, API, Firebase), basta passar outro `PedidoRepositorio` para `criarServicos()`, sem mexer nas telas.

## Ideias "uau"

### 1. Monte seu combo do intervalo
Na tela inicial, o aluno escolhe **quanto tem no bolso** (até R$ 15, 20, 25, 30), **em quanto tempo precisa do lanche** (até 5, 10, 15 min) e **o jeito** do combo. O app mostra até 3 combos (principal + bebida, com ou sem sobremesa) que cabem nas duas restrições, sem repetir o prato principal. "Quero esse combo" põe tudo no carrinho.

- **A regra de sugestão é uma Strategy plugável.** `EstrategiaSugestao` (`src/sugestao/EstrategiaSugestao.ts`) tem só `aceita(combo)` e `comparar(a, b)`. Hoje existem quatro: `MaisEmConta`, `MaisRapido`, `MataFome` e `Leve` (`src/sugestao/estrategias.ts`). Uma regra nova é uma classe nova registrada em `estrategiasSugestao` (`src/sugestao/index.ts`): geração dos combos, filtros de orçamento e tempo, hook e tela não mudam. Há um teste provando isso com uma estratégia criada só no teste.
- **O tempo considera a fila real.** `estimarMinutos` usa o item mais demorado do combo + 1 min por pedido já na fila. Com o balcão cheio, combos saem da janela de "até 5 min".
- **Dados, não código.** Cada categoria do `cardapio.json` diz seu papel no combo (`tipo`: principal, bebida ou sobremesa), cada item tem `tempoPreparo` e os itens leves têm `leve: true`.

> ⚠️ Os tempos de preparo são **estimativas da equipe** (vitrine ≈ 1–4 min; tapioca e cuscuz, feitos na hora, 4–8 min). Vale confirmar com a Imperial e ajustar o `cardapio.json`.

### 2. Balcão que fala
Quando um pedido passa para **Pronto**, a tela do balcão anuncia com a síntese de voz nativa do navegador (Web Speech API, voz pt-BR): *"Senha A 42, Tales! Coxinha de frango e Suco Recife saindo! Pode retirar no balcão."*

- Anuncia também quando **outro aparelho** marca o pedido como pronto (a lista chega pelo repositório). Pedidos que já estavam prontos ao abrir o balcão não são repetidos.
- Botões **🔊 Voz ligada/desligada** e **📢 Chamar de novo** (no ticket pronto), para o aluno que não ouviu.
- O texto é uma função pura e testável (`textoAnuncio`, `src/voz/anuncio.ts`). Quem fala fica atrás da interface `Anunciador` (`src/voz/Anunciador.ts`), injetada por `criarServicos()`. Dá para trocar por um alto-falante de verdade, ou por um falso nos testes.
- A senha é falada como "A 42", não "A menos zero quarenta e dois".

> Os navegadores só liberam a voz depois de alguma interação com a página. Clique uma vez em qualquer lugar da aba do balcão (por exemplo, no botão de voz) quando abrir o turno.

### 3. Rachar pedido com colegas
Na tela **Seu pedido**, o grupo pode ativar **👥 Rachar com colegas** (de 2 a 6 pessoas) e escolher como dividir a conta:
- **A regra de divisão é uma Strategy (`EstrategiaDivisao`, `src/divisao/EstrategiaDivisao.ts`).** Existem duas estratégias prontas em `src/divisao/estrategias.ts`:
  - `DivisaoIgualitaria` (**🤝 Igual pra todos**): divide em centavos inteiros e distribui eventual resto de centavos sem perder nem criar dinheiro.
  - `DivisaoPorItem` (**🥐 Cada um paga o seu**): desmembra itens com quantidade > 1 em unidades individuais e permite marcar quem pediu cada item.
- **Pagamento individual por colega**: na tela **Pagamento**, cada participante tem a sua vez, escolhe seu próprio meio (`Pix` ou `Cartão`), valida seus dados separadamente e o pedido registra a cota e o meio de cada um no comprovante.

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
| Arquivos .ts/.tsx | 1 | 41 |
| LOC | 632 | 1501 |
| Maior arquivo (LOC) | 632 | 161 |
| Complexidade máxima de uma função | 40 (`App`) | 8 (`TelaInicio`, `TelaPagamento`) |
| Complexidade média por função | 3,58 | 1,92 |

A coluna "Depois" já inclui as duas ideias "uau" (combo e balcão que fala), que somam cerca de 330 LOC. Sem elas, a refatoração sozinha ficava em 1169 LOC.

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
- O LOC total **subiu** (632 → 1169 só com a refatoração). É o custo de interfaces, tipos, imports e duas implementações de repositório. Em troca, nenhum arquivo passa de 161 linhas e a regra de negócio tem 60 testes.

### Testes (`npm test`)
- `repositorio/contrato.test.ts`: **teste de contrato (Liskov)**. A mesma bateria roda contra `MemoriaPedidoRepositorio` e `LocalStoragePedidoRepositorio`, e as duas precisam se comportar igual. Também confere a compatibilidade com os dados gravados pela versão go-horse.
- `servicos/PedidoService.test.ts`: finalizar (sucesso, senhas em sequência, cada erro de validação), transições do balcão, zerar dia.
- `dominio/dominio.test.ts`: carrinho, regras do pedido, cardápio (inclusive `tipo` e `tempoPreparo` válidos em todo item) e horários de retirada.
- `sugestao/sugestao.test.ts`: geração de combos, preço em centavos, tempo com fila, o exemplo "R$ 15 e pronto em 5 min", cada estratégia, e uma estratégia nova plugada sem mudar o código existente.
- `divisao/divisao.test.ts`: divisão igualitária (incluindo distribuição exata de centavos), divisão por item (desmembrando unidades), e uma estratégia nova plugada sem alterar código existente (Aberto/Fechado).
- `voz/voz.test.ts`: texto do anúncio (senha falada, primeiro nome, até dois itens) e a detecção de quem acabou de ficar pronto, inclusive depois de "Zerar dia".

### Dívidas que continuam
- `TelaInicio` e `TelaPagamento` têm complexidade 8, vinda dos condicionais de JSX.
- Depois de "Zerar dia", a senha guardada no celular do aluno pode coincidir com um pedido novo de mesmo número.
- O balcão não tem autenticação: qualquer um que abra `#/balcao` muda pedidos.
