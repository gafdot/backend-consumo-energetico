// Importação das bibliotecas necessárias
const express = require('express'); // Framework para servidor web
const sqlite3 = require('sqlite3').verbose(); // Banco de dados SQLite
const bcrypt = require('bcrypt'); // Biblioteca para hashing de senhas
const jwt = require('jsonwebtoken'); // Biblioteca para geração de tokens JWT
const cors = require('cors'); // Middleware para lidar com CORS
const http = require('http'); // Servidor HTTP
const { Server } = require('socket.io'); // Biblioteca para WebSocket

// Configuração da aplicação
const app = express();
const PORT = 3000; // Porta onde o servidor será iniciado
const SECRET_KEY = 'sua_chave_secreta'; // Chave secreta para geração de tokens JWT

app.use(express.json()); // Middleware para tratar JSON no corpo das requisições
app.use(cors()); // Middleware para habilitar CORS

// Configuração do servidor HTTP e do WebSocket
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Permite conexões de qualquer origem
        methods: ['GET', 'POST'], // Permite métodos GET e POST
    }
});

// Banco de dados SQLite
const db = new sqlite3.Database('banco-de-dados.db'); // Cria ou abre o banco de dados SQLite

// Criação das tabelas de usuários e dados dos sensores no banco de dados
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS dados_sensores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_id INTEGER,
        temperatura REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Função para inserir dados dos sensores no banco e emitir evento para clientes conectados
async function addSensorData(newData) {
    await insertSensorData(newData); // Insere os dados no banco de dados
    io.emit('sensorDataUpdate', newData); // Emite evento para clientes WebSocket
}

// Conexão de novos clientes WebSocket
io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Rota para cadastro de novos usuários
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Verificar se o usuário já existe no banco de dados
        db.get('SELECT * FROM usuarios WHERE username = ?', [username], async (err, row) => {
            if (row) {
                return res.status(400).json({ message: 'Usuário já existe' });
            }
            // Criptografar a senha
            const hashedPassword = await bcrypt.hash(password, 10);
            // Inserir o novo usuário no banco de dados
            db.run('INSERT INTO usuarios (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
                if (err) {
                    console.error('Erro ao cadastrar usuário:', err.message);
                    return res.status(500).json({ message: 'Erro ao cadastrar usuário' });
                }
                res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
            });
        });
    } catch (err) {
        console.error('Erro ao processar o cadastro:', err.message);
        res.status(500).json({ message: 'Erro ao processar o cadastro' });
    }
});

// Rota para login de usuários
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Verificar se o usuário existe
    db.get('SELECT * FROM usuarios WHERE username = ?', [username], async (err, row) => {
        if (!row) {
            return res.status(400).json({ message: 'Usuário ou senha incorretos' });
        }
        // Comparar a senha criptografada
        const isPasswordValid = await bcrypt.compare(password, row.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Usuário ou senha incorretos' });
        }
        // Gerar um token JWT para autenticação
        const token = jwt.sign({ userId: row.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Login realizado com sucesso', token });
    });
});

// Middleware para autenticar usuários usando JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (token) {
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Acesso negado' });
            }
            req.user = user; // Anexa o usuário ao request
            next();
        });
    } else {
        res.status(401).json({ message: 'Token não fornecido' });
    }
};

// Rota protegida para buscar todos os dados dos sensores
app.get('/dados-sensores', authenticateJWT, (req, res) => {
    const query = `SELECT * FROM dados_sensores`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar dados no banco de dados:', err.message);
            res.status(500).send('Erro ao buscar os dados.');
        } else {
            res.json(rows);
        }
    });
});

// Rota protegida para buscar dados dos sensores em um intervalo de tempo
app.get('/dados-sensores/tempo', authenticateJWT, (req, res) => {
    const { inicio, fim } = req.query; // Parâmetros de intervalo de data
    if (!inicio || !fim) {
        return res.status(400).json({ message: 'Os parâmetros de data "inicio" e "fim" são obrigatórios.' });
    }
    const query = `SELECT * FROM dados_sensores WHERE timestamp BETWEEN ? AND ?`;
    db.all(query, [inicio, fim], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar dados no banco de dados:', err.message);
            res.status(500).send('Erro ao buscar os dados.');
        } else {
            res.json(rows);
        }
    });
});

// Rota para inserir novos dados dos sensores
app.post('/dados-sensores', async (req, res) => {
    const dados = req.body;
    console.log('Dados recebidos dos sensores:', dados);
    try {
        await addSensorData(dados); // Insere e emite evento com os dados
        res.send('Dados recebidos e armazenados com sucesso.');
    } catch (err) {
        console.error('Erro ao inserir dados no banco de dados:', err.message);
        res.status(500).send('Erro ao processar os dados.');
    }
});

// Rota protegida para limpar todos os dados da tabela
app.delete('/limpar-dados', authenticateJWT, (req, res) => {
    const query = `DELETE FROM dados_sensores`;
    db.run(query, [], (err) => {
        if (err) {
            console.error('Erro ao limpar dados do banco de dados:', err.message);
            res.status(500).send('Erro ao limpar os dados.');
        } else {
            console.log('Dados da tabela limpos com sucesso.');
            res.send('Dados da tabela foram limpos com sucesso.');
        }
    });
});

// Inicia o servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
