# 🛒 DNCommerce Backend

Backend RESTful para um sistema de **e-commerce de produtos de beleza**, desenvolvido com **Node.js**, **Express** e **MySQL**.  
O projeto implementa autenticação de clientes, gerenciamento de produtos, pedidos, estoque e vendas, além de rotinas de testes e scripts SQL.

---

## 🚀 Tecnologias Utilizadas

- **Node.js** + **Express**
- **MySQL** (armazenamento relacional)
- **Jest** (testes automatizados)
- **Insomnia/Postman** (coleção para testar a API)
- **dotenv** (configuração de variáveis de ambiente)

---

## 📂 Estrutura do Projeto

```
dncommerce-backend/
│── config/                # Configuração do banco de dados
│── middleware/            # Middlewares (validação, tratamento de erros)
│── routes/                # Definição das rotas da API
│── scripts/               # Scripts SQL e utilitários
│── tests/                 # Testes automatizados + coleção Insomnia
│── utils/                 # Helpers e utilitários
│── server.js              # Ponto de entrada da aplicação
│── package.json           # Dependências e scripts NPM
│── .env.example           # Exemplo de variáveis de ambiente
```

---

## ⚙️ Configuração do Ambiente

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/dncommerce-backend.git
   cd dncommerce-backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo `.env` baseado no `.env.example`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_NAME=dncommerce
   DB_PORT=3306
   PORT=3000
   ```

4. Crie o banco de dados:
   ```bash
   mysql -u root -p < scripts/01-create-database-schema.sql
   mysql -u root -p < scripts/02-seed-sample-data.sql
   ```

5. Inicie o servidor:
   ```bash
   npm start
   ```

6. O backend estará disponível em:  
   ```
   http://localhost:3000
   ```

---

## 📡 Endpoints Principais

### Produtos
- `GET /produtos` → Listar produtos  
- `POST /produtos` → Criar novo produto  
- `PUT /produtos/:id` → Atualizar produto  
- `DELETE /produtos/:id` → Remover produto  

### Clientes
- `GET /clientes` → Listar clientes  
- `POST /clientes` → Criar cliente  
- `PUT /clientes/:id` → Atualizar cliente  
- `DELETE /clientes/:id` → Remover cliente  

### Pedidos
- `GET /pedidos` → Listar pedidos  
- `POST /pedidos` → Criar novo pedido  
- `PUT /pedidos/:id` → Atualizar pedido  
- `DELETE /pedidos/:id` → Cancelar pedido  

### Vendas
- `GET /vendas` → Listar vendas  
- `POST /vendas` → Registrar venda  

### Estoque
- `GET /estoque` → Consultar estoque  
- `PUT /estoque/:produto_id` → Atualizar estoque  

---

## 🗄️ Banco de Dados

O schema está definido em [`scripts/01-create-database-schema.sql`](./scripts/01-create-database-schema.sql).  
Além disso, há um arquivo de seed com dados de exemplo em [`scripts/02-seed-sample-data.sql`](./scripts/02-seed-sample-data.sql).

📊 **Diagrama Entidade-Relacionamento (ERD):**  
Gerado via [dbdiagram.io](https://dbdiagram.io).  

![Diagrama ER](./docs/diagrama.png)

---

## 🧪 Testes

Rodar todos os testes com Jest:
```bash
npm test
```

Coleção do **Insomnia** disponível em: [`tests/insomnia-collection.json`](./tests/insomnia-collection.json)

---

## 👨‍💻 Autor

- **Seu Nome Aqui**  
- 💼 [LinkedIn](https://www.linkedin.com/in/seu-perfil)  
- 📧 seuemail@exemplo.com  

---

✨ Projeto desenvolvido para prática de **APIs RESTful**, **MySQL** e **boas práticas de backend**.
