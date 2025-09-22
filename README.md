📚 Sistema de Gerenciamento de Biblioteca

Um sistema completo de gerenciamento de biblioteca desenvolvido com Next.js, TypeScript e Tailwind CSS. Este projeto permite cadastrar, listar, editar e excluir livros através de uma interface web moderna e responsiva.

## 🚀 Demonstração

[[Ver Demo ao Vivo](https://desafio-06dncescola.vercel.app/) 

## ✨ Funcionalidades

### 📖 Gerenciamento de Livros
- **Listar Livros**: Visualização de todos os livros cadastrados em cards organizados
- **Cadastrar Livros**: Formulário completo para adicionar novos livros
- **Editar Livros**: Atualização de informações de livros existentes
- **Excluir Livros**: Remoção de livros com confirmação de segurança

### 🎨 Interface do Usuário
- Design responsivo que funciona em desktop e mobile
- Interface limpa e intuitiva
- Notificações toast para feedback do usuário
- Estados de carregamento para melhor UX
- Navegação fluida entre páginas

### 🔧 Recursos Técnicos
- API RESTful completa com operações CRUD
- Validação de formulários
- Tratamento de erros robusto
- TypeScript para type safety
- Componentes reutilizáveis

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Biblioteca de componentes
- **React Hooks** - Gerenciamento de estado

### Backend
- **Next.js API Routes** - Endpoints RESTful
- **Node.js** - Runtime JavaScript
- **JSON** - Armazenamento de dados (em memória)

### Ferramentas de Desenvolvimento
- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Vercel** - Deploy e hospedagem

## 📁 Estrutura do Projeto

\`\`\`
biblioteca-sistema/
├── app/
│   ├── api/
│   │   └── books/
│   │       ├── route.ts          # GET, POST /api/books
│   │       └── [id]/
│   │           └── route.ts      # GET, PUT, DELETE /api/books/[id]
│   ├── cadastrar-livros/
│   │   └── page.tsx              # Página de cadastro
│   ├── editar-livro/
│   │   └── [id]/
│   │       └── page.tsx          # Página de edição
│   ├── globals.css               # Estilos globais
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Página inicial (listagem)
├── components/
│   └── ui/                       # Componentes shadcn/ui
├── hooks/
│   ├── use-mobile.tsx            # Hook para detecção mobile
│   └── use-toast.ts              # Hook para notificações
├── lib/
│   ├── books-data.ts             # Dados e utilitários dos livros
│   └── utils.ts                  # Utilitários gerais
├── next.config.mjs               # Configuração Next.js
├── package.json                  # Dependências
├── tailwind.config.ts            # Configuração Tailwind
└── tsconfig.json                 # Configuração TypeScript
\`\`\`

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Instalação

1. **Clone o repositório**
\`\`\`bash
git clone https://github.com/seu-usuario/biblioteca-sistema.git
cd biblioteca-sistema
\`\`\`

2. **Instale as dependências**
\`\`\`bash
npm install
# ou
yarn install
\`\`\`

3. **Execute o projeto**
\`\`\`bash
npm run dev
# ou
yarn dev
\`\`\`

4. **Acesse a aplicação**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📡 API Endpoints

### Livros

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| `GET` | `/api/books` | Lista todos os livros | - |
| `POST` | `/api/books` | Cria um novo livro | `{ titulo, numeroPaginas, isbn, editora }` |
| `GET` | `/api/books/[id]` | Busca livro por ID | - |
| `PUT` | `/api/books/[id]` | Atualiza livro existente | `{ titulo, numeroPaginas, isbn, editora }` |
| `DELETE` | `/api/books/[id]` | Remove livro | - |

### Exemplo de Requisição

\`\`\`javascript
// Criar um novo livro
const response = await fetch('/api/books', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    titulo: 'Dom Casmurro',
    numeroPaginas: 256,
    isbn: '978-85-359-0277-5',
    editora: 'Companhia das Letras'
  })
});
\`\`\`

### Exemplo de Resposta

\`\`\`json
{
  "id": 1,
  "titulo": "Dom Casmurro",
  "numeroPaginas": 256,
  "isbn": "978-85-359-0277-5",
  "editora": "Companhia das Letras"
}
\`\`\`

## 🎯 Funcionalidades Detalhadas

### 📋 Listagem de Livros
- Exibição em grid responsivo
- Cards com informações essenciais
- Botões de ação (editar/excluir)
- Estado de carregamento
- Mensagem quando não há livros

### ➕ Cadastro de Livros
- Formulário com validação
- Campos obrigatórios
- Feedback visual de sucesso/erro
- Limpeza automática após cadastro

### ✏️ Edição de Livros
- Formulário pré-preenchido
- Validação de dados
- Confirmação de alterações
- Redirecionamento após sucesso

### 🗑️ Exclusão de Livros
- Confirmação antes da exclusão
- Feedback visual
- Atualização automática da lista

## 🔧 Configuração e Personalização

### Modificar Dados Iniciais
Edite o arquivo `lib/books-data.ts` para alterar os livros pré-cadastrados:

\`\`\`typescript
export const books: Book[] = [
  {
    id: 1,
    titulo: "Seu Livro",
    numeroPaginas: 200,
    isbn: "978-0-000-00000-0",
    editora: "Sua Editora"
  }
];
\`\`\`

### Personalizar Estilos
Os estilos podem ser modificados em:
- `app/globals.css` - Estilos globais e variáveis CSS
- Componentes individuais - Classes Tailwind CSS

### Adicionar Validações
Modifique os endpoints da API em `app/api/books/` para adicionar validações customizadas.

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte seu repositório GitHub ao Vercel**
2. **Configure as variáveis de ambiente (se necessário)**
3. **Deploy automático a cada push**

\`\`\`bash
# Ou use a CLI do Vercel
npm i -g vercel
vercel
\`\`\`

### Outras Plataformas
- **Netlify**: Configure build command como `npm run build`
- **Railway**: Deploy direto do GitHub
- **Heroku**: Adicione `package.json` com scripts de build

## 🧪 Testes

Para executar os testes (quando implementados):

\`\`\`bash
npm run test
# ou
yarn test
\`\`\`

## 📈 Melhorias Futuras

### Funcionalidades Planejadas
- [ ] Busca e filtros avançados
- [ ] Categorização de livros
- [ ] Sistema de empréstimos
- [ ] Autenticação de usuários
- [ ] Dashboard administrativo
- [ ] Relatórios e estatísticas

### Melhorias Técnicas
- [ ] Banco de dados persistente
- [ ] Cache de dados
- [ ] Testes automatizados
- [ ] PWA (Progressive Web App)
- [ ] Internacionalização (i18n)


![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
