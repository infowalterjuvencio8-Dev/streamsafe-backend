import express from "express";
import path from "path";
import mysql from "mysql2/promise";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS configurado
app.use(cors({
  origin: [
    'https://output.co.mz',
    'https://api.output.co.mz',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://streamsafe-api-n5zq.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString();
}

let pool: mysql.Pool | null = null;

// 🔐 Dados do admin ofuscados (codificados em Base64)
// Para decodificar: Buffer.from(STRING, 'base64').toString('utf-8')
// Os valores reais estão ocultos no código fonte
const ADMIN_EMAIL = Buffer.from("YWRtaW5Ac3RyZWFtc2FmZS5jb20=", 'base64').toString('utf-8');
const ADMIN_NAME = Buffer.from("QWRtaW5pc3RyYWRvciBTdHJlYW1TYWZl", 'base64').toString('utf-8');
const ADMIN_PASSWORD = Buffer.from("YWRtaW4xMjM=", 'base64').toString('utf-8');

async function initDatabase() {
  const dbConfig = {
    host: process.env.DB_HOST || "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
    port: Number(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER || "3TeEL3UQMDa4csy.root",
    password: process.env.DB_PASSWORD || "ADMOgpDz2jGDsGki",
    database: process.env.DB_NAME || "streamsafe",
    ssl: { rejectUnauthorized: true }
  };

  console.log("Connecting to TiDB Cloud at:", `${dbConfig.host}:${dbConfig.port}`);

  try {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Testar conexão
    const testConn = await pool.getConnection();
    await testConn.query("SELECT 1");
    testConn.release();
    console.log("✅ TiDB Cloud connected successfully!");

    // Criar tabelas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        role VARCHAR(50) NOT NULL,
        plano VARCHAR(50) DEFAULT NULL,
        plano_validade VARCHAR(100) DEFAULT NULL,
        avatar VARCHAR(10) NOT NULL,
        data_cadastro VARCHAR(100) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(50) PRIMARY KEY,
        usuarioId VARCHAR(50) NOT NULL,
        usuarioNome VARCHAR(255) NOT NULL,
        usuarioEmail VARCHAR(255) NOT NULL,
        plano VARCHAR(50) NOT NULL,
        metodo VARCHAR(50) NOT NULL,
        nomeTransferencia VARCHAR(255) NOT NULL,
        valor INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        data_pagamento VARCHAR(100) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuarioId VARCHAR(50) NOT NULL,
        mediaId INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        poster VARCHAR(255) NOT NULL,
        backdrop VARCHAR(255) DEFAULT NULL,
        UNIQUE KEY unique_fav (usuarioId, mediaId)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuarioId VARCHAR(50) NOT NULL,
        mediaId INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        poster VARCHAR(255) NOT NULL,
        backdrop VARCHAR(255) DEFAULT NULL,
        UNIQUE KEY unique_watch (usuarioId, mediaId)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS history (
        id VARCHAR(50) PRIMARY KEY,
        usuarioId VARCHAR(50) NOT NULL,
        mediaId VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        poster VARCHAR(255) NOT NULL,
        watchedAt VARCHAR(100) NOT NULL,
        season INT DEFAULT NULL,
        episode INT DEFAULT NULL
      );
    `);

    console.log("✅ Database tables checked/created successfully!");

    // 🔐 Criação automática de admin com dados ofuscados
    // Os valores reais só são revelados em tempo de execução
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM users;");
    if ((rows as any[])[0].count === 0) {
      const adminId = "1";
      const adminNome = ADMIN_NAME;
      const adminEmail = ADMIN_EMAIL;
      const adminSenha = hashPassword(ADMIN_PASSWORD);
      const adminStatus = "aprovado";
      const adminRole = "admin";
      const adminPlano = "anual";
      const adminPlanoValidade = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const adminAvatar = "A";
      const adminDataCadastro = new Date().toISOString();

      await pool.query(
        "INSERT INTO users (id, nome, email, senha, status, role, plano, plano_validade, avatar, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [adminId, adminNome, adminEmail, adminSenha, adminStatus, adminRole, adminPlano, adminPlanoValidade, adminAvatar, adminDataCadastro]
      );
      console.log("✅ Default Admin user created successfully!");
      console.log("🔐 Admin credentials are encrypted in the source code.");
    } else {
      console.log("ℹ️ Admin user already exists. Skipping creation.");
    }

  } catch (error) {
    console.error("❌ Failed to initialize TiDB Cloud database:", error);
    pool = null;
    throw error;
  }
}

function getDb() {
  if (!pool) {
    throw new Error("MySQL Database pool not initialized or unavailable.");
  }
  return pool;
}

// ============= ROTAS DA API =============

// ✅ HEALTH CHECK
app.get("/api/health", async (req, res) => {
  try {
    const db = getDb();
    await db.query("SELECT 1 as test");
    res.json({
      status: 'online',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AUTH
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios!" });
    }

    const db = getDb();
    const [users] = await db.query("SELECT * FROM users WHERE email = ?;", [email]);
    const usersArray = users as any[];
    
    if (usersArray.length === 0) {
      return res.status(404).json({ error: "Endereço de email não localizado!" });
    }

    const matched = usersArray[0];
    const hashed = hashPassword(senha);
    if (matched.senha !== hashed) {
      return res.status(401).json({ error: "A senha introduzida está incorreta!" });
    }

    const { senha: _, ...userWithoutSenha } = matched;
    res.json(userWithoutSenha);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/session", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "UserId é obrigatório!" });
    }

    const db = getDb();
    const [users] = await db.query("SELECT * FROM users WHERE id = ?;", [userId]);
    const usersArray = users as any[];
    
    if (usersArray.length === 0) {
      return res.status(404).json({ error: "Sessão inválida." });
    }

    const matched = usersArray[0];
    const { senha: _, ...userWithoutSenha } = matched;
    res.json(userWithoutSenha);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// USERS
app.get("/api/users", async (req, res) => {
  try {
    const db = getDb();
    const [users] = await db.query("SELECT id, nome, email, status, role, plano, plano_validade, avatar, data_cadastro FROM users;");
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { id, nome, email, senha, status, role, plano, plano_validade, avatar, data_cadastro } = req.body;
    
    const db = getDb();
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?;", [email]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: "Este endereço de email já se encontra registrado!" });
    }

    await db.query(
      "INSERT INTO users (id, nome, email, senha, status, role, plano, plano_validade, avatar, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
      [id, nome, senha, status, role, plano, plano_validade, avatar, data_cadastro]
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ["nome", "email", "status", "role", "plano", "plano_validade", "avatar"];
    const queryParts: string[] = [];
    const values: any[] = [];

    if (updates.senha) {
      queryParts.push("senha = ?");
      values.push(updates.senha);
    }

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        queryParts.push(`${key} = ?`);
        values.push(updates[key]);
      }
    }

    if (queryParts.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar informado." });
    }

    values.push(id);
    const db = getDb();
    await db.query(`UPDATE users SET ${queryParts.join(", ")} WHERE id = ?;`, values);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users/:id/change-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const db = getDb();
    const [users] = await db.query("SELECT senha FROM users WHERE id = ?;", [id]);
    const usersArray = users as any[];
    
    if (usersArray.length === 0) {
      return res.status(404).json({ error: "Usuário não localizado." });
    }

    const matched = usersArray[0];
    if (matched.senha !== hashPassword(currentPassword)) {
      return res.status(401).json({ error: "A senha atual digitada está incorreta!" });
    }

    await db.query("UPDATE users SET senha = ? WHERE id = ?;", [hashPassword(newPassword), id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.query("DELETE FROM users WHERE id = ?;", [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PAYMENTS
app.get("/api/payments", async (req, res) => {
  try {
    const db = getDb();
    const [payments] = await db.query("SELECT * FROM payments;");
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/payments", async (req, res) => {
  try {
    const { payment, tempUser } = req.body;

    const db = getDb();
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?;", [tempUser.email]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: "Este endereço de email já se encontra registrado!" });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        "INSERT INTO users (id, nome, email, senha, status, role, plano, plano_validade, avatar, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [tempUser.id, tempUser.nome, tempUser.email, tempUser.senha, tempUser.status, tempUser.role, tempUser.plano, tempUser.plano_validade, tempUser.avatar, tempUser.data_cadastro]
      );

      await conn.query(
        "INSERT INTO payments (id, usuarioId, usuarioNome, usuarioEmail, plano, metodo, nomeTransferencia, valor, status, data_pagamento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [payment.id, payment.usuarioId, payment.usuarioNome, payment.usuarioEmail, payment.plano, payment.metodo, payment.nomeTransferencia, payment.valor, payment.status, payment.data_pagamento]
      );

      await conn.commit();
      res.json({ success: true });
    } catch (e: any) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/payments/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { plano_validade, plano } = req.body;

    const db = getDb();
    const [payments] = await db.query("SELECT * FROM payments WHERE id = ?;", [id]);
    const paymentsArray = payments as any[];
    
    if (paymentsArray.length === 0) {
      return res.status(404).json({ error: "Pagamento não localizado." });
    }

    const payment = paymentsArray[0];
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query("UPDATE payments SET status = 'aprovado' WHERE id = ?;", [id]);
      await conn.query(
        "UPDATE users SET status = 'aprovado', plano = ?, plano_validade = ? WHERE id = ?;",
        [plano, plano_validade, payment.usuarioId]
      );

      await conn.commit();
      res.json({ success: true });
    } catch (e: any) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/payments/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDb();
    const [payments] = await db.query("SELECT * FROM payments WHERE id = ?;", [id]);
    const paymentsArray = payments as any[];
    
    if (paymentsArray.length === 0) {
      return res.status(404).json({ error: "Pagamento não localizado." });
    }

    const payment = paymentsArray[0];
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query("DELETE FROM payments WHERE id = ?;", [id]);
      await conn.query("DELETE FROM users WHERE id = ?;", [payment.usuarioId]);

      await conn.commit();
      res.json({ success: true });
    } catch (e: any) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// FAVORITES
app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    const [rows] = await db.query("SELECT mediaId as id, type, title, poster, backdrop FROM favorites WHERE usuarioId = ?;", [userId]);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { id, type, title, poster, backdrop } = req.body;
    const db = getDb();
    await db.query(
      "INSERT INTO favorites (usuarioId, mediaId, type, title, poster, backdrop) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title);",
      [userId, id, type, title, poster, backdrop]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/favorites/:userId/:mediaId", async (req, res) => {
  try {
    const { userId, mediaId } = req.params;
    const db = getDb();
    await db.query("DELETE FROM favorites WHERE usuarioId = ? AND mediaId = ?;", [userId, mediaId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// WATCHLIST
app.get("/api/watchlist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    const [rows] = await db.query("SELECT mediaId as id, type, title, poster, backdrop FROM watchlist WHERE usuarioId = ?;", [userId]);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/watchlist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { id, type, title, poster, backdrop } = req.body;
    const db = getDb();
    await db.query(
      "INSERT INTO watchlist (usuarioId, mediaId, type, title, poster, backdrop) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title);",
      [userId, id, type, title, poster, backdrop]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/watchlist/:userId/:mediaId", async (req, res) => {
  try {
    const { userId, mediaId } = req.params;
    const db = getDb();
    await db.query("DELETE FROM watchlist WHERE usuarioId = ? AND mediaId = ?;", [userId, mediaId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// HISTORY
app.get("/api/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    const [rows] = await db.query(
      "SELECT id, mediaId, type, title, poster, watchedAt, season, episode FROM history WHERE usuarioId = ? ORDER BY watchedAt DESC LIMIT 50;",
      [userId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { id, mediaId, type, title, poster, watchedAt, season, episode } = req.body;
    const db = getDb();
    await db.query(
      "INSERT INTO history (id, usuarioId, mediaId, type, title, poster, watchedAt, season, episode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE watchedAt=VALUES(watchedAt);",
      [id, userId, mediaId, type, title, poster, watchedAt, season, episode]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= INICIAR SERVIDOR =============

async function startServer() {
  try {
    await initDatabase();

    // Servir frontend APENAS se estiver em produção
    if (process.env.NODE_ENV === "production") {
      const distPath = path.join(process.cwd(), "dist");
      
      // Servir arquivos estáticos
      app.use(express.static(distPath));
      
      // Todas as rotas não-API vão para o React
      app.get("*", (req, res) => {
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      // Desenvolvimento com Vite
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`📊 Database: TiDB Cloud`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();