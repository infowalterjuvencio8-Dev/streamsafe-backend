import express from "express";
import path from "path";
import mysql from "mysql2/promise";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Match client-side hashPassword algorithm
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

// Global DB pool variable
let pool: mysql.Pool;

async function initDatabase() {
  const dbConfig = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  };

  console.log("Connecting to MySQL at:", `${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}`);

  try {
    // 1. Connect without selecting database to ensure database exists
    const connection = await mysql.createConnection(dbConfig);
    await connection.query("CREATE DATABASE IF NOT EXISTS streamsafe_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    await connection.end();

    // 2. Create the connection pool with database selected
    pool = mysql.createPool({
      ...dbConfig,
      database: "streamsafe_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log("Database 'streamsafe_db' verified and pool initialized successfully!");

    // 3. Create tables
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

    console.log("Database tables checked/created successfully!");

    // 4. Initialize default admin user if users table is empty
    const [rows]: [any[], any] = await pool.query("SELECT COUNT(*) as count FROM users;");
    if (rows[0].count === 0) {
      const adminId = "1";
      const adminNome = "Administrador StreamSafe";
      const adminEmail = "admin@streamsafe.com";
      const adminSenha = hashPassword("admin123");
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
      console.log("Default Admin user registered successfully on the backend MySQL database!");
    }

  } catch (error) {
    console.error("CRITICAL: Failed to initialize MySQL database. Starting server in mockup mode as fallback.", error);
  }
}

// Helper to check if MySQL pool is active
function getDb() {
  if (!pool) {
    throw new Error("MySQL Database pool not initialized or unavailable.");
  }
  return pool;
}

// API Routes

// 1. Authentication Endpoints
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios!" });
    }

    const [users]: [any[], any] = await getDb().query("SELECT * FROM users WHERE email = ?;", [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: "Endereço de email não localizado!" });
    }

    const matched = users[0];
    const hashed = hashPassword(senha);
    if (matched.senha !== hashed) {
      return res.status(401).json({ error: "A senha introduzida está incorreta!" });
    }

    // Exclude password from the returned object
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

    const [users]: [any[], any] = await getDb().query("SELECT * FROM users WHERE id = ?;", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: "Sessão inválida." });
    }

    const matched = users[0];
    const { senha: _, ...userWithoutSenha } = matched;
    res.json(userWithoutSenha);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Users Management Endpoints
app.get("/api/users", async (req, res) => {
  try {
    const [users]: [any[], any] = await getDb().query("SELECT id, nome, email, status, role, plano, plano_validade, avatar, data_cadastro FROM users;");
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { id, nome, email, senha, status, role, plano, plano_validade, avatar, data_cadastro } = req.body;
    
    // Check duplication
    const [existing]: [any[], any] = await getDb().query("SELECT id FROM users WHERE email = ?;", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Este endereço de email já se encontra registrado!" });
    }

    await getDb().query(
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

    // Check password change request
    if (updates.senha) {
      queryParts.push("senha = ?");
      values.push(updates.senha); // assumed hashed already by client, or hashPassword(senha)
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
    await getDb().query(`UPDATE users SET ${queryParts.join(", ")} WHERE id = ?;`, values);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users/:id/change-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const [users]: [any[], any] = await getDb().query("SELECT senha FROM users WHERE id = ?;", [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: "Usuário não localizado." });
    }

    const matched = users[0];
    if (matched.senha !== hashPassword(currentPassword)) {
      return res.status(401).json({ error: "A senha atual digitada está incorreta!" });
    }

    await getDb().query("UPDATE users SET senha = ? WHERE id = ?;", [hashPassword(newPassword), id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await getDb().query("DELETE FROM users WHERE id = ?;", [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Payments Endpoints
app.get("/api/payments", async (req, res) => {
  try {
    const [payments]: [any[], any] = await getDb().query("SELECT * FROM payments;");
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/payments", async (req, res) => {
  try {
    const { payment, tempUser } = req.body;

    // Check user duplication
    const [existing]: [any[], any] = await getDb().query("SELECT id FROM users WHERE email = ?;", [tempUser.email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Este endereço de email já se encontra registrado!" });
    }

    // Begin a simple transaction to insert user and payment cleanly
    const conn = await getDb().getConnection();
    try {
      await conn.beginTransaction();

      // Insert the user
      await conn.query(
        "INSERT INTO users (id, nome, email, senha, status, role, plano, plano_validade, avatar, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [tempUser.id, tempUser.nome, tempUser.email, tempUser.senha, tempUser.status, tempUser.role, tempUser.plano, tempUser.plano_validade, tempUser.avatar, tempUser.data_cadastro]
      );

      // Insert the payment
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

    const [payments]: [any[], any] = await getDb().query("SELECT * FROM payments WHERE id = ?;", [id]);
    if (payments.length === 0) {
      return res.status(404).json({ error: "Pagamento não localizado." });
    }

    const payment = payments[0];
    const conn = await getDb().getConnection();
    try {
      await conn.beginTransaction();

      // Update payment status
      await conn.query("UPDATE payments SET status = 'aprovado' WHERE id = ?;", [id]);

      // Update user status & subscription
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

    const [payments]: [any[], any] = await getDb().query("SELECT * FROM payments WHERE id = ?;", [id]);
    if (payments.length === 0) {
      return res.status(404).json({ error: "Pagamento não localizado." });
    }

    const payment = payments[0];
    const conn = await getDb().getConnection();
    try {
      await conn.beginTransaction();

      // Remove payment request
      await conn.query("DELETE FROM payments WHERE id = ?;", [id]);

      // Remove transient user since signup registration is cancelled/rejected
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

// 4. Favorites APIs
app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows]: [any[], any] = await getDb().query("SELECT mediaId as id, type, title, poster, backdrop FROM favorites WHERE usuarioId = ?;", [userId]);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { id, type, title, poster, backdrop } = req.body;
    await getDb().query(
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
    await getDb().query("DELETE FROM favorites WHERE usuarioId = ? AND mediaId = ?;", [userId, mediaId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Watchlist APIs
app.get("/api/watchlist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows]: [any[], any] = await getDb().query("SELECT mediaId as id, type, title, poster, backdrop FROM watchlist WHERE usuarioId = ?;", [userId]);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/watchlist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { id, type, title, poster, backdrop } = req.body;
    await getDb().query(
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
    await getDb().query("DELETE FROM watchlist WHERE usuarioId = ? AND mediaId = ?;", [userId, mediaId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. History APIs
app.get("/api/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows]: [any[], any] = await getDb().query(
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
    await getDb().query(
      "INSERT INTO history (id, usuarioId, mediaId, type, title, poster, watchedAt, season, episode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE watchedAt=VALUES(watchedAt);",
      [id, userId, mediaId, type, title, poster, watchedAt, season, episode]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Express Vite Integration Middleware Setup
async function startServer() {
  await initDatabase();

  // Vite development middleware or static production asset pipeline
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
