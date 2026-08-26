# AutoRent - Sistema de Aluguel de Carros

Sistema completo de aluguel de carros com frontend em HTML/Tailwind CSS e backend em Node.js/Express com MySQL.

## Stack

- **Frontend**: HTML5, Tailwind CSS 3.4, JavaScript ES6+
- **Backend**: Node.js 18+, Express 4.18
- **Banco**: MySQL 8.0+ (mysql2)
- **Deploy**: Vercel

## Funcionalidades

- Catálogo de carros com imagens e preços
- Busca por data e local de retirada
- Modal de reserva com cálculo automático de valor
- Formulário de contato
- Verificação de disponibilidade
- API REST completa com validação

## Pré-requisitos

- Node.js 18+
- MySQL 8.0+
- npm ou yarn

## Instalação

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd project-car-rental

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais do banco

# Criar o banco de dados e tabelas
mysql -u root -p < criar_banco.sql

# Inserir dados de exemplo
mysql -u root -p bancocarLocal < inserir_carros.sql

# Gerar o CSS (em outro terminal)
npm run build:css

# Iniciar o servidor
npm run dev
```

## Estrutura do Projeto

```
project-car-rental/
├── server.js                    # Entrypoint do servidor
├── src/
│   ├── config/
│   │   └── database.js          # Configuração e pool de conexão MySQL
│   ├── controllers/
│   │   ├── carrosController.js  # Lógica de carros
│   │   ├── reservasController.js # Lógica de reservas
│   │   └── contatosController.js # Lógica de contatos
│   └── routes/
│       ├── carrosRoutes.js      # Rotas de carros
│       ├── reservasRoutes.js    # Rotas de reservas
│       └── contatosRoutes.js    # Rotas de contatos
├── index.html                   # Página principal
├── script.js                    # Lógica do frontend
├── src/input.css                # Estilos Tailwind (source)
├── styles.css                   # CSS compilado (gerado)
├── tailwind.config.js           # Configuração do Tailwind
├── postcss.config.js            # Configuração do PostCSS
├── criar_banco.sql              # Script de criação do banco
├── inserir_carros.sql           # Dados de exemplo
├── .env.example                 # Template de variáveis de ambiente
└── package.json
```

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/carros` | Listar todos os carros |
| GET | `/api/carros/:id` | Buscar carro por ID |
| GET | `/api/carros/:id/disponibilidade` | Verificar disponibilidade |
| GET | `/api/reservas` | Listar todas as reservas |
| POST | `/api/reservas` | Criar nova reserva |
| POST | `/api/contatos` | Enviar mensagem de contato |
| GET | `/api/health` | Health check |

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DB_HOST` | Host do MySQL | localhost |
| `DB_PORT` | Porta do MySQL | 3306 |
| `DB_USER` | Usuário do MySQL | root |
| `DB_PASSWORD` | Senha do MySQL | - |
| `DB_NAME` | Nome do banco | bancocarLocal |
| `PORT` | Porta do servidor | 3000 |

## Deploy na Vercel

1. Fazer push do repositório para o GitHub
2. Conectar o repositório na Vercel
3. Configurar as variáveis de ambiente no painel da Vercel
4. Deploy automático a cada push na branch main

**Nota**: A Vercel é serverless, então o MySQL precisa ser acessível externamente (ex: AWS RDS, PlanetScale, ou MySQL externo).

## Licença

MIT
