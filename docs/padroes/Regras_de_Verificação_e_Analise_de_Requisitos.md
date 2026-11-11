# Regras de Verificação e Análise de Requisitos

**Projeto:** Inquérito Digital — GCC 188 (2026-2)
**Localização:** pasta `docs/padroes/`

As regras abaixo seguem o capítulo 1 ("Especificação de Requisitos") do livro **Engenharia de Software — Rogério Magela Fernandes Azevedo**. Todas são **objetivas**: dois verificadores diferentes aplicando a mesma regra a um mesmo requisito devem chegar ao mesmo resultado. Requisitos subjetivos são considerados **não conformes**.

## Regra V1 — Modelo de identificação

Todo requisito funcional deve ter identificador no formato **RF + 3 dígitos** (RF001, RF002, ...) e todo requisito não funcional **NF + 3 dígitos** (NF001, NF002, ...), conforme o modelo da disciplina. O identificador não pode ser reutilizado e não deve ser renumerado depois de publicado. Numeração vigente do projeto: **RF001–RF015** e **NF001–NF008**.

## Regra V2 — Início com verbo no infinitivo

O **título** de cada requisito funcional / caso de uso deve começar com **verbo no infinitivo**. Verificação: a primeira palavra do título deve constar da lista de verbos adotados (Realizar, Cadastrar, Consultar, Alterar, Excluir, Abrir, Encerrar, Registrar...). Requisitos não funcionais são títulos substantivos por natureza (ex.: "Tempo de resposta", "Padrão de mensagens") e ficam isentos desta regra.

## Regra V3 — Proibição de termos subjetivos

O texto do requisito **não pode conter** as seguintes palavras: *"amigável", "simples", "rápido", "fácil", "bonito", "melhor", "adequado", "eficiente"*. Verificação: busca textual no documento; qualquer ocorrência invalida o requisito até a reescrita.

## Regra V4 — Mensurabilidade

Requisitos não funcionais devem conter **pelo menos um número mensurável** (quantidade, percentual, tempo em segundos, versão de software, tamanho). Verificação: conferência de que o requisito tem no mínimo um número; requisito sem número é não conforme.

## Regra V5 — Limite de tamanho

Cada fluxo (principal ou alternativo) de um caso de uso deve ter no máximo **10 linhas**, e cada linha no máximo **300 caracteres**. Verificação: contagem numérica direta.

## Regra V6 — Rastreabilidade crítica

Cada requisito funcional deve estar referenciado em, no mínimo: (a) uma tarefa do Kanban com o identificador no título; (b) um caso de uso no diagrama de casos de uso com o **nome idêntico** ao do requisito; (c) uma interface (nome único) quando aplicável. Verificação: checklist cruzado por requisito.

## Regra V7 — Precondição de acesso

Todo requisito cujo detalhamento só possa ser executado após autenticação deve declarar na pré-condição a expressão padrão **"Investigador autenticado"** (nas variações adotadas no documento: "O Investigador deve estar autenticado no sistema..." ou "Investigador autenticado, na tela `I_...`"). Verificação: busca textual por "autenticado". Exceções legítimas: RF009 (o login é o próprio requisito — pré-condição é o cadastro ativo) e RF014 (pré-condição é a inexistência de cadastro duplicado).

## Regra V8 — Duas colunas nos fluxos

Os fluxos principal e alternativos devem usar as colunas **Ator** e **Sistema**, alternando a responsabilidade. Fluxos que descrevem apenas o sistema sem referência à ação do ator são **não conformes**.

## Checklist de aplicação (tarefa #16)

| Requisito | V1 | V2 | V3 | V4* | V5 | V6 | V7 | Resultado |
|---|---|---|---|---|---|---|---|---|
| RF001–RF015 | ✔ | ✔ | ✔ | — | ✔ | ✔ | ✔ | Conforme |
| NF001–NF008 | ✔ | ✔ | ✔ | ✔ | — | ✔ | ✔ | Conforme |

*V4 aplica-se apenas a NFs; V5 apenas a detalhamentos de fluxos.*