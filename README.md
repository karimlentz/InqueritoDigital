# Inquérito Digital - Plataforma de Investigação Criminal

Bem-vindo ao repositório do **Inquérito Digital**, uma plataforma web desenvolvida para otimizar o fluxo de envio, gestão e vinculação de inquéritos criminais.

Este projeto foi desenvolvido como parte do projeto final da disciplina de **Engenharia de Software** e foca em entregar uma experiência ponta a ponta, conectando investigadores responsáveis pela condução dos casos ao fichamento de suspeitos e ao cruzamento de evidências de campo.

---

## 1. CONTEXTO DO PROBLEMA E SOLUÇÃO

No cenário das delegacias de investigação, o gerenciamento de inquéritos sofre com a fragmentação de informações. A "dor" principal dos investigadores é a dificuldade de conectar dados de campo isolados: o registro de um suspeito não se vincula automaticamente às evidências de um caso. Isso gera atrasos, perda de informações confidenciais e dificulta a gestão do caso.

O **Inquérito Digital** surge como uma plataforma centralizada para solucionar essa fragmentação. O sistema propicia o controle restrito de acesso por login, o cadastro independente de fichas de **Suspeitos** e a abertura transacional de **Investigações** — uma operação que une em tempo real o investigador ativo, o suspeito principal e as evidências recolhidas na cena do crime, gerando um dossiê unificado.

---

## 2. INSTRUÇÕES PARA USO

### Usuário Final:

Caso você não seja um desenvolvedor e deseje apenas utilizar a aplicação finalizada na sua máquina, siga os passos abaixo:

1. **Pré-requisitos:** Certifique-se de ter o **Node.js** instalado em seu computador (versão 18 ou superior).
2. **Download:** Na página deste repositório no GitHub, clique no botão verde "Code" e selecione "Download ZIP". Descompacte a pasta no seu computador.
3. **Instalação do Banco de Dados:** O sistema utiliza um banco de dados local (SQLite) que é criado automaticamente na primeira execução, dispensando instalações complexas de SGDBs.
4. **Instalando as dependências:** Abra o terminal (ou prompt de comando) dentro da pasta descompactada e digite:
   ```bash
   npm install
   ```
5. **Rodando o sistema:** Após a instalação, inicie a aplicação com o comando:
   ```bash
   npm start
   ```
6. **Acesso:** Abra o seu navegador preferido (Chrome, Firefox, etc.) e digite a URL `http://localhost:3000`. O sistema exibirá a tela de Login.

### Desenvolvedor:
Siga as instruções abaixo para preparar seu ambiente e atuar como um Desenvolvedor (DEV) neste projeto:

1. **Clonando o repositório:** Abra o terminal na pasta onde deseja salvar o projeto e aplique o comando:
```bash
git clone <URL_DO_REPOSITORIO_AQUI>
```
*(Você também pode baixar o arquivo .zip do projeto e extraí-lo, caso prefira não usar a linha de comando no primeiro momento).*

2. **Instalando bibliotecas e dependências:** Navegue até a pasta do projeto clonado e execute o comando:
```bash
npm install
```
3. **Executando o projeto em ambiente de desenvolvimento:** Para rodar o servidor com *hot-reload* (atualização automática ao salvar o código), vá para a pasta raiz e execute o comando:
```bash
npm run dev
```
Em seguida, acesse o browser e digite a URL `http://localhost:3000`. Você deverá ver o sistema rodando e pronto para receber suas alterações.

---

## 4. TECNOLOGIAS

As seguintes tecnologias, linguagens e ferramentas foram empregadas na construção deste software:

* **Controle de Versão e Colaboração:** Git, GitHub e GitKraken (utilizando *branches* para isolar *features* e testes).
* **Front-end (Interface):** [Insira aqui o Framework/Linguagem, ex: React.js, HTML/CSS/Tailwind]
* **Back-end (Servidor):** [Insira aqui o Framework/Linguagem, ex: Node.js com Express]
* **Banco de Dados:** [Insira aqui o Banco de Dados, ex: PostgreSQL ou SQLite]
* **Qualidade e Testes:** Cypress (para testes End-to-End simulando o usuário) e Jest (para testes unitários).

---

## 5. ORGANIZAÇÃO DO PROJETO

Este projeto está organizado nas pastas descritas abaixo, visando a separação de responsabilidades (Clean Code) e facilitando a manutenção:

## Estrutura de Pastas

* **`src/`**: Contém o código-fonte principal da aplicação.
    * **`src/components/`**: Componentes reutilizáveis da interface do usuário (ex: botões, modais, formulários).
    * **`src/controllers/`**: Regras de negócio e transações do CRUD complexo (vinculação de suspeitos e inquéritos).
    * **`src/models/`**: Definição da estrutura das tabelas do banco de dados (investigadores, suspeitos, investigacoes, evidencias).
    * **`src/utils/`**: Funções auxiliares, utilitárias e validações (ex: máscara de CPF).
* **`docs/`**: Documentação do projeto, incluindo diagramas, manuais e documento de requisitos.
* **`tests/`**: Arquivos e scripts de testes automatizados (Testes de integração e Cypress).
* **`public/`**: Arquivos estáticos acessíveis diretamente, como imagens, ícones e o `index.html` inicial.
* **`assets/`**: Recursos visuais auxiliares e identidade visual da plataforma.
* **`config/`**: Arquivos de configuração do projeto, variáveis de ambiente e conexão com o banco de dados.

---

## 6. EQUIPE DE DESENVOLVIMENTO:

* **Karim Soares Lentz** 
* **Rafaella Tavares Moreira** 