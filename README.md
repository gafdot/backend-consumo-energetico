# Projeto de Monitoramento com Express, SQLite, WebSocket e JWT

Este projeto implementa uma API RESTful para um sistema de monitoramento de dados de sensores, usando `Express` como framework backend, `SQLite` como banco de dados, `Socket.IO` para comunicação em tempo real via WebSocket, e `JWT` para autenticação de usuários.

---

## Tabela de Conteúdos

1. [Requisitos](#requisitos)
2. [Instalação](#instalação)
3. [Configuração](#configuração)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Arquitetura e Fluxo de Dados](#arquitetura-e-fluxo-de-dados)
6. [Uso](#uso)
7. [API - Endpoints](#api---endpoints)
8. [WebSocket](#websocket)
9. [Autenticação](#autenticação)
10. [Segurança](#segurança)
11. [Considerações Finais](#considerações-finais)

---

## 1. Requisitos

- Node.js v14 ou superior
- npm (gerenciador de pacotes do Node.js)
- Banco de dados SQLite
- Ferramenta para testar a API, como `Postman` ou `curl`

---

## 2. Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/gafdot/backend-IoT-dados-sensores
   cd backend-IoT-dados-sensores
   ```

2. **Instale as dependências do projeto:**

   ```bash
   npm install
   ```

3. **Inicie o servidor:**

   ```bash
   node server.js
   ```

O servidor será iniciado em `http://localhost:3000`.

---

## 3. Configuração

### Configuração do JWT

- O sistema utiliza uma chave secreta (`SECRET_KEY`) para assinar os tokens JWT. Esta chave está definida no código. Em produção, é recomendado usar variáveis de ambiente para configurá-la.

### Configuração do WebSocket

- A configuração do WebSocket com `Socket.IO` permite conexões de qualquer origem (`CORS`). Em um ambiente de produção, é recomendado restringir as origens.

---

## 4. Estrutura do Projeto

- `server.js`: Arquivo principal que configura o servidor, rotas e banco de dados.
- `public/`: Contém os arquivos estáticos do projeto (opcional).
- `db/`: Contém o banco de dados SQLite.

---

## 5. Arquitetura e Fluxo de Dados

### Fluxo Geral:

1. O usuário faz uma **requisição de autenticação** (`/register` para cadastro e `/login` para login).
2. Após o login, o sistema gera um **token JWT**, que o cliente deve enviar em requisições subsequentes para rotas protegidas.
3. O **WebSocket** permite que os clientes recebam atualizações em tempo real sobre novos dados dos sensores.

### Componentes

- **Express**: Gerencia as rotas e controla a lógica principal do servidor.
- **SQLite**: Banco de dados para armazenar informações de usuários e dados de sensores.
- **JWT (JSON Web Token)**: Utilizado para autenticar e autorizar usuários.
- **Socket.IO**: Implementa comunicação bidirecional para transmitir dados dos sensores em tempo real.

---

## 6. Uso

### Executando o Projeto

Após a instalação e configuração, siga as instruções para utilizar o sistema:

1. **Cadastro de Usuário**: Use a rota `/register` para criar uma conta.
2. **Login**: Use a rota `/login` para obter o token de acesso JWT.
3. **Acesso às Rotas Protegidas**: Envie o token nas rotas protegidas, como `/dados-sensores`.

---

## 7. API - Endpoints

### Autenticação e Gerenciamento de Usuário

#### `POST /register`

Registra um novo usuário no sistema.

- **Body**: `{ "username": "exemplo", "password": "senha" }`
- **Resposta**: `{ "message": "Usuário cadastrado com sucesso" }`

#### `POST /login`

Autentica o usuário e retorna um token JWT.

- **Body**: `{ "username": "exemplo", "password": "senha" }`
- **Resposta**: `{ "message": "Login realizado com sucesso", "token": "jwt-token" }`

#### `GET /dados-sensores` (Protegida)

Retorna todos os dados de sensores armazenados.

- **Header**: `Authorization: Bearer <token>`
- **Resposta**: `[ { "id": 1, "sensor_id": 1, "temperatura": 23.5, "umidade": 55.2, "timestamp": "2023-11-01T10:00:00" }, ... ]`

#### `GET /dados-sensores/tempo` (Protegida)

Retorna dados de sensores dentro de um intervalo de tempo especificado.

- **Parâmetros de Query**: `inicio` e `fim` no formato `AAAA-MM-DD HH:MM:SS`
- **Resposta**: Lista de dados de sensores no intervalo solicitado.

### Manipulação de Dados de Sensores

#### `POST /dados-sensores`

Insere novos dados de sensores.

- **Body**: `{ "sensor_id": 1, "temperatura": 25.0, "umidade": 50.0 }`
- **Resposta**: Mensagem de sucesso.

#### `DELETE /limpar-dados` (Protegida)

Limpa todos os dados da tabela de sensores.

- **Header**: `Authorization: Bearer <token>`
- **Resposta**: Mensagem de sucesso.

---

## 8. WebSocket

O WebSocket permite que os clientes sejam notificados em tempo real quando há novos dados de sensores. O cliente deve:

1. Conectar-se ao servidor WebSocket em `ws://localhost:3000`.
2. Escutar o evento `sensorDataUpdate` para receber dados atualizados de sensores.

---

## 9. Autenticação

O sistema usa `JWT` para autenticação. O token é gerado no login e enviado no cabeçalho `Authorization` como `Bearer <token>`. As rotas protegidas verificam o token e autorizam o acesso ao usuário autenticado.

---

## 10. Segurança

1. **Armazenamento de Senhas**: As senhas são hashadas com `bcrypt`, garantindo que não sejam armazenadas em texto puro.
2. **Token JWT**: O token expira após 1 hora para aumentar a segurança. Em produção, recomenda-se usar uma chave secreta complexa.
3. **CORS**: Para segurança, restrinja a origem permitida em `io` para o domínio específico que utilizará a aplicação.

---

## 11. Considerações Finais

Este projeto é uma base sólida para aplicações de monitoramento e comunicação em tempo real. Para produção, considere:

- Configurar variáveis de ambiente para dados sensíveis (como `SECRET_KEY`).
- Implementar estratégias de renovação de tokens para melhorar a experiência de usuário sem comprometer a segurança.
- Aumentar a segurança CORS com uma lista de origens confiáveis.
