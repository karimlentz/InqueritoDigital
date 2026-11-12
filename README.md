# Inquérito Digital - Plataforma de Investigação Criminal

Bem-vindo ao repositório do **Inquérito Digital**, uma plataforma web desenvolvida para otimizar o fluxo de envio, gestão e vinculação de inquéritos criminais.

Este projeto foi desenvolvido como parte do projeto final da disciplina de **Engenharia de Software** e foca em entregar uma experiência ponta a ponta, conectando investigadores responsáveis pela condução dos casos ao fichamento de suspeitos e ao cruzamento de evidências de campo.

---

## 1. CONTEXTO DO PROBLEMA E SOLUÇÃO

No cenário das delegacias de investigação, o gerenciamento de inquéritos sofre com a fragmentação de informações. A "dor" principal dos investigadores é a dificuldade de conectar dados de campo isolados: o registro de um suspeito não se vincula automaticamente às evidências de um caso. Isso gera atrasos, perda de informações confidenciais e dificulta a gestão do caso.

O **Inquérito Digital** surge como uma plataforma centralizada para solucionar essa fragmentação. O sistema propicia o controle restrito de acesso por login, o cadastro independente de fichas de **Suspeitos** e a abertura transacional de **Investigações** — uma operação que une em tempo real o investigador ativo, o suspeito principal e as evidências recolhidas na cena do crime, gerando um dossiê unificado.

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

Este projeto está organizado nas pastas descritas abaixo, visando a separação de responsabilidades (Clean Code) e facilitando a manutenção:

## Estrutura de Pastas

*   **`src/`**: Contém o código-fonte principal da aplicação.
    *   **`src/components/`**: Componentes reutilizáveis da interface do usuário.
    *   **`src/utils/`**: Funções auxiliares e utilitárias.
*   **`docs/`**: Documentação do projeto, incluindo manuais e especificações.
    *   **'requisitos/'**: Documento de Requisitos.
    *   **'padroes'/**: Documentos de Padões adotados.
*   **`tests/`**: Arquivos e scripts de testes automatizados.
*   **`public/`**: Arquivos estáticos, como imagens e o `index.html` inicial.
*   **`assets/`**: Recursos visuais e outros ativos do projeto.
*   **`config/`**: Arquivos de configuração do projeto.

---

## 5. EQUIPE DE DESENVOLVIMENTO:

* **Karim Soares Lentz**
* **Rafaella Tavares Moreira**
* **Júlio César Requena Fraga**
