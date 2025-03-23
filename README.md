# Paggo 🧾

Este projeto é uma aplicação completa de upload e leitura de documentos (PDFs e imagens), com extração de texto via OCR, explicações usando IA (GPT), e funcionalidades como download em PDF, exclusão de documentos e perguntas personalizadas sobre o conteúdo.

[Visite a aplicação em produção](https://paggo.vercel.app/)

---

## 📁 Estrutura do Projeto

O repositório é dividido em duas pastas principais:

- `paggo-backend`: Backend em NestJS com OCR, GPT e banco de dados PostgreSQL.
- `paggo-frontend`: Frontend em Next.js com autenticação, upload de arquivos e interface de perguntas.

---

## 🚀 Como Rodar Localmente

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- [PostgreSQL](https://www.postgresql.org/download/) instalado e rodando localmente
- Um banco de dados criado em sua instância PostgreSQL

Você pode criar o banco com o seguinte comando (via psql ou pgAdmin):

```sql
CREATE DATABASE nomedobanco;
```

> Substitua `nomedobanco` pelo nome que desejar colocar no seu PostgreSQL local.

---

### 2. Clonar o Repositório

```bash
git clone https://github.com/rodrigodiasz/paggo.git
cd paggo
```

---

### 3. Backend (`paggo-backend`)

#### Acessar a pasta:

```bash
cd paggo-backend
```

#### Criar o arquivo `.env` com sua configuração local:

```env
DATABASE_URL="postgresql://postgres:sua-senha@localhost:5432/nome-do-banco?schema=public"
OPENAI_API_KEY=SUA_CHAVE_DA_OPENAI
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=7d
```

> Substitua `sua-senha` e `nome-do-banco` pela senha e nome real do seu PostgreSQL local.

#### Instalar dependências:

```bash
npm install
```

#### Gerar o banco e o client do Prisma:

```bash
npx prisma migrate dev
npx prisma generate
```

#### Rodar o servidor:

```bash
npm run start:dev
```

> O backend estará rodando em: `http://localhost:3000`

---

### 4. Frontend (`paggo-frontend`)

Abra outro terminal e:

```bash
cd paggo-frontend
```

#### Criar o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
API_URL=http://localhost:3000
```

#### Instalar dependências:

```bash
npm install
```

#### Rodar o frontend:

```bash
npm run dev
```

> A aplicação estará acessível em: `http://localhost:3001` (ou a porta padrão do Next.js)

---

## ✅ Funcionalidades

- [x] Autenticação de usuários (login/cadastro)
- [x] Upload de imagens e PDFs
- [x] OCR com Tesseract.js
- [x] Extração de texto de PDFs com `pdf-parse`
- [x] Explicação do conteúdo com OpenAI (GPT)
- [x] Histórico de documentos
- [x] Download do documento em PDF processado
- [x] Perguntas personalizadas sobre o conteúdo
- [x] Exclusão de documentos

---

## 🛠️ Tecnologias

- **Frontend**: Next.js, React, TailwindCSS, jsPDF
- **Backend**: NestJS, Tesseract.js, pdf-parse, Prisma, PostgreSQL, OpenAI
- **Autenticação**: JWT
- **Deploy**: Railway (backend) e Vercel (frontend)

---

Feito por Rodrigo Oliveira
