const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Carregar variáveis de ambiente do arquivo .env
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Importação das rotas
const authRoutes = require("./routes/auth");
const alunosRoutes = require("./routes/alunos");
const professoresRoutes = require("./routes/professores");
const exerciciosRoutes = require("./routes/exercicios");
const aulasRoutes = require("./routes/aulas");

const app = express();

// Configuração CORS mais permissiva para desenvolvimento
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pasta estática para arquivos do frontend
app.use(express.static(path.join(__dirname, "../build")));

// Rota de health check - CRUCIAL para o Elastic Beanstalk
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "API funcionando", timestamp: new Date().toISOString() });
});

// Rota básica para teste
app.get("/api", (req, res) => {
  res.status(200).json({ message: "API Iron House - Fitness e Performance" });
});

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/alunos", alunosRoutes);
app.use("/api/professores", professoresRoutes);
app.use("/api/exercicios", exerciciosRoutes);
app.use("/api/aulas", aulasRoutes);

// Rota para o frontend em produção
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../build", "index.html"));
});

// Função para criar usuário admin inicial
const criarUsuarioAdmin = async () => {
  try {
    const User = require("./models/user");
    const adminExistente = await User.findOne({ email: "admin@example.com" });

    if (!adminExistente) {
      const novoAdmin = new User({
        nome: "Administrador",
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
      });

      await novoAdmin.save();
      console.log("Usuário admin criado com sucesso");
    }
  } catch (error) {
    console.error("Erro ao criar usuário admin:", error);
  }
};

// Conexão com o MongoDB com melhor tratamento de erros
const connectDB = async () => {
  try {
    const connectionString =
      process.env.MONGODB_URI ||
      "mongodb+srv://rodncb:xxkPSIme4RSWz0Wr@cluster0.ffkqtjd.mongodb.net/ironhouse?retryWrites=true&w=majority&appName=Cluster0";

    console.log("Tentando conectar ao MongoDB...");
    await mongoose.connect(connectionString);
    console.log("Conexão com MongoDB estabelecida com sucesso");

    // Criar usuário admin após conexão bem-sucedida
    await criarUsuarioAdmin();
    return true;
  } catch (err) {
    console.error("Erro ao conectar com MongoDB:", err.message);
    // Em produção, não continue sem banco de dados
    if (process.env.NODE_ENV === "production") {
      console.error("Falha crítica - não é possível operar sem banco de dados");
      return false;
    }
    console.log("Aplicação continuará em modo offline com localStorage");
    return false;
  }
};

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: "Erro no servidor", error: err.message });
});

// Porta - CRUCIAL PARA O ELASTIC BEANSTALK
const PORT = process.env.PORT || 8080;

// Inicialização simplificada do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  // Conectar ao banco de dados após o servidor iniciar
  connectDB().then((success) => {
    if (success) {
      console.log("Aplicação totalmente inicializada com banco de dados");
    } else if (process.env.NODE_ENV === "production") {
      console.log(
        "ATENÇÃO: Aplicação em produção sem conexão com banco de dados"
      );
    }
  });
});

module.exports = app;
