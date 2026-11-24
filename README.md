# Inquérito Digital - Plataforma de Investigação Criminal

Bem-vindo ao repositório do **Inquérito Digital**, uma plataforma web desenvolvida para otimizar o fluxo de envio, gestão e vinculação de inquéritos criminais.

Este projeto foi desenvolvido como parte do projeto final da disciplina de **Engenharia de Software** e foca em entregar uma experiência ponta a ponta, conectando investigadores responsáveis pela condução dos casos ao fichamento de suspeitos e ao cruzamento de evidências de campo.

---

## 1. CONTEXTO DO PROBLEMA E SOLUÇÃO

No cenário das delegacias de investigação, o gerenciamento de inquéritos sofre com a fragmentação de informações. A "dor" principal dos investigadores é a dificuldade de conectar dados de campo isolados: o registro de um suspeito não se vincula automaticamente às evidências de um caso. Isso gera atrasos, perda de informações confidenciais e dificulta a gestão do caso.

O **Inquérito Digital** surge como uma plataforma centralizada para solucionar essa fragmentação. O sistema propicia o controle restrito de acesso por login, o cadastro independente de fichas de **Suspeitos** e a abertura transacional de **Investigações** — uma operação que une em tempo real o investigador ativo, o suspeito principal e as evidências recolhidas na cena do crime, gerando um dossiê unificado. Cada investigador terá um mural indivídual para organizar as informações (suspeitos, evidências e comentários) da forma que achar necessário.

## 2. INSTRUÇÕES PARA USO

### 2.1 Usuário Final
1. **Pré-requisitos:** instale o **Node.js 18 LTS** (ou superior) — download em [nodejs.org](https://nodejs.org). Não é necessário instalar nenhum banco de dados: o SQLite é criado automaticamente na primeira execução.
2. **Download:** na página deste repositório no GitHub, clique em "Code" → "Download ZIP", extraia a pasta no seu computador.
3. **Instalando as dependências:** abra o terminal (prompt de comando) **dentro da pasta descompactada** e digite:
   ```bash
   npm install
   ```
4. **Rodando o sistema:** ainda na pasta raiz, inicie a aplicação com:
   ```bash
   npm start
   ```
5. **Acesso:** abra seu navegador (Chrome 120+ / Firefox 120+) e acesse `http://localhost:3000`. O sistema exibirá a tela de **Login**.
6. **Login de demonstração:** e-mail `karim@pcmg.gov.br`, senha `123456` (outros investigadores pré-cadastrados: `julio@pcmg.gov.br` e `rafaella@pcmg.gov.br`, mesma senha).

### 2.2 Desenvolvedor
1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/karimlentz/InqueritoDigital.git
   ```
   *(ou baixe o .zip e extraia, caso prefira não usar o terminal no primeiro momento)*
2. **Instalar bibliotecas e dependências** (Node resolve via `package.json`):
   ```bash
   npm install
   ```
3. **Executar em desenvolvimento:** na pasta raiz, execute:
   ```bash
   npm run dev
   ```
   Em seguida, acesse `http://localhost:3000` no browser. Alterações no HTML/CSS/JS do front aparecem recarregando a página; alterações no backend reiniciam sozinhas (`node --watch`).
4. **Testes:**
   ```bash
   npm test                # testes unitários (Jest) — validações, regras de negócio
   npx cypress open        # testes de interface caixa preta (Cypress) — a aplicação precisa estar rodando
   ```
5. **Banco local:** `data/inquerito.db` (SQLite), criado com o schema do Dicionário de Dados (`config/schema.sql`) na primeira execução. Regras de Git: ver [PadroesAdotados/Regras_de_Uso_do_Git.md](PadroesAdotados/Regras_de_Uso_do_Git.md).

---

## 3. TECNOLOGIAS

As seguintes tecnologias, linguagens e ferramentas foram empregadas na construção deste software:

* **Controle de Versão e Colaboração:Git, GitHub e GitKraken** 
* **Front-end (Interface):HTML5, CSS3 e JavaScript** 
* **Back-end (Servidor): Node.js 18 LTS (ou superior) com Express 4.x** 
* **Banco de Dados:SQLite** 
* **IDE : VSCode**

---

## 4. ORGANIZAÇÃO DO PROJETO

## Padrões e Regras de Uso do Git

Para garantir a rastreabilidade das entregas, evitar conflitos de código e manter o histórico organizado entre todos os integrantes da equipe, o repositório segue as regras descritas abaixo.

### 4.1 Organização de Pastas (Código vs. Documentação)
Nenhum arquivo de documentação deve ser salvo na raiz do projeto (exceto o `README.md`) ou dentro de `src/`, assim como nenhum arquivo de código-fonte deve ser armazenado em `docs/`:

* **`src/`**: Código-fonte principal da aplicação (dividido em subpastas como `src/components/` e `src/utils/`).
* **`docs/`**: Toda a documentação do projeto, separada obrigatoriamente por categoria:
  * **`docs/requisitos/`**: Documentos de elicitação, histórias de usuário, regras de negócio e especificações de requisitos.
  * **`docs/padroes-adotados/`**: Padrões definidos pela equipe (regras do Git, critérios de verificação de requisitos, padrões de codificação e diagramas).
* **`tests/`**: Arquivos e scripts de testes automatizados.
* **`public/`**: Arquivos públicos estáticos (ex.: `index.html`, favicons).
* **`assets/`**: Imagens, ícones e recursos visuais.
* **`config/`**: Arquivos de configuração de ambiente, banco de dados e ferramentas.

### 4.2 Fluxo de Trabalho e Uso de Branches

* **Branch `main`**: Contém exclusivamente código e documentação estáveis, revisados e testados. É proibido realizar commits diretos na `main`.
* **Branches de Trabalho**: Toda nova tarefa, correção ou documento deve ser desenvolvido em uma branch isolada criada a partir da `main` (`git checkout -b <tipo>/<descricao-curta>`), seguindo a nomenclatura:
  * `feature/<descricao-curta>`: Desenvolvimento de novas funcionalidades (ex.: `feature/cadastro-animais`).
  * `fix/<descricao-curta>`: Correção de bugs ou falhas (ex.: `fix/validacao-login`).
  * `docs/<descricao-curta>`: Criação ou atualização de documentação e diagramas (ex.: `docs/regras-git`).
* **Frequência de Commits (Regra de Backup Diário)**: Cada integrante deve realizar commits ao final de cada dia ou sessão de trabalho na sua respectiva branch, registrando o progresso incremental. É proibido acumular dias de trabalho para realizar um único commit no encerramento da sprint.
* **Integração (`Merge` / Pull Request)**: Ao concluir uma tarefa e vinculá-la ao card no GitHub Projects, o autor deve atualizar sua branch com a `main` (`git pull origin main`), resolver eventuais conflitos localmente e abrir um Pull Request para revisão de pelo menos um integrante da equipe antes da mesclagem na `main`.

### 4.3 Padrões de commit

Este projeto segue o padrão Conventional Commits com identificação do autor entre colchetes:

`<tipo>: [Nome] <descrição curta no imperativo>`

**Regras objetivas:**
* **Tamanho e escrita:** o título deve ter entre **15 e 72 caracteres**, escrito em **letras minúsculas** e **sem ponto final**.
* **Identificação:** informar o primeiro nome do integrante entre colchetes logo após os dois-pontos (`[Nome]`).
* **Atomicidade:** cada commit deve representar uma alteração lógica única, sem misturar documentação (`docs/`) e código (`src/`) no mesmo registro.
* **Frequência diária:** realizar commits ao final de cada sessão de trabalho na branch da tarefa e enviar ao repositório remoto (`git push`).

| Tipo | Quando usar |
| :--- | :--- |
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Mudança de código sem alterar comportamento |
| `docs` | Alterações em documentação |
| `style` | Formatação, espaços — sem impacto em lógica |
| `test` | Adição ou modificação de testes |
| `chore` | Ajustes de build, CI, dependências |

**Exemplos:**
* `feat: [Karim] cria formulario de cadastro de animais`
* `fix: [Rafaella] corrige validacao de senha vazia no login`

### 4.4 Baselines, Tags e Releases
Ao final de cada marco de entrega (sprint), é criada uma **Tag** anotada e uma **Release** no GitHub contendo as *Release Notes* com o resumo do que foi entregue:
* `v0.1`: Baseline da documentação de requisitos.
* `v0.2`: Baseline da documentação de design detalhado (diagramas de classes, pacotes e sequência).
* `v0.3`: Baseline da entrega funcional com CRUD implementado e implantado.

---

## 5. EQUIPE DE DESENVOLVIMENTO:

* **Karim Soares Lentz**
* **Rafaella Tavares Moreira**
* **Júlio César Requena Fraga**