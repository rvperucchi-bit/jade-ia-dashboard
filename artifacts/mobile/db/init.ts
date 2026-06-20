import type { SQLiteDatabase } from "expo-sqlite";

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      value REAL NOT NULL,
      phone TEXT NOT NULL,
      column_name TEXT NOT NULL,
      tag TEXT NOT NULL,
      tag_color TEXT NOT NULL,
      time_label TEXT NOT NULL,
      initials TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      contact_name TEXT NOT NULL,
      last_message TEXT NOT NULL,
      time_label TEXT NOT NULL,
      unread INTEGER NOT NULL DEFAULT 0,
      initials TEXT NOT NULL,
      avatar_color TEXT NOT NULL,
      is_online INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      text TEXT NOT NULL,
      sender TEXT NOT NULL,
      time_label TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const meta = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = ?",
    ["seeded"]
  );

  if (!meta) {
    await seedDatabase(db);
    await db.runAsync(
      "INSERT INTO app_meta (key, value) VALUES (?, ?)",
      ["seeded", "1"]
    );
  }
}

async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  const leads = [
    ["1", "Carlos Mendes", "TechBrasil", 12500, "+55 11 99999-1111", "novo", "E-commerce", "#6C63FF", "2h atrás", "CM", "#FF6B35"],
    ["2", "Ana Souza", "Inova LTDA", 8900, "+55 21 99999-2222", "novo", "SaaS", "#FF0080", "5h atrás", "AS", "#00D68F"],
    ["3", "Pedro Rocha", "Digital Hub", 34000, "+55 31 99999-3333", "qualificado", "Enterprise", "#FFB300", "1d atrás", "PR", "#6C63FF"],
    ["4", "Mariana Lima", "StartUp XP", 6700, "+55 41 99999-4444", "qualificado", "PME", "#00D68F", "2d atrás", "ML", "#FF0080"],
    ["5", "Roberto Costa", "Fintec Brasil", 52000, "+55 51 99999-5555", "proposta", "Fintech", "#4ECDC4", "3d atrás", "RC", "#FFB300"],
    ["6", "Juliana Ferreira", "AutoMais", 18900, "+55 61 99999-6666", "proposta", "Auto", "#FF6B35", "4d atrás", "JF", "#4ECDC4"],
    ["7", "Lucas Alves", "HealthPro", 27500, "+55 71 99999-7777", "proposta", "Health", "#00D68F", "5d atrás", "LA", "#00BCD4"],
    ["8", "Beatriz Santos", "EduTech", 9800, "+55 81 99999-8888", "fechado", "EdTech", "#AB47BC", "1sem atrás", "BS", "#AB47BC"],
    ["9", "Diego Nunes", "LogiMax", 41200, "+55 91 99999-9999", "fechado", "Logística", "#FF6B35", "2sem atrás", "DN", "#FF6B35"],
  ] as const;

  for (const [id, name, company, value, phone, column_name, tag, tag_color, time_label, initials, avatar_color] of leads) {
    await db.runAsync(
      `INSERT INTO leads (id, name, company, value, phone, column_name, tag, tag_color, time_label, initials, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, company, value, phone, column_name, tag, tag_color, time_label, initials, avatar_color]
    );
  }

  const conversations = [
    ["1", "Carlos Mendes", "Qual o valor mensal? Preciso apresentar para minha diretoria.", "10:24", 3, "CM", "#FF6B35", 1],
    ["2", "Ana Souza", "Perfeito! Vou encaminhar para o financeiro hoje.", "09:15", 0, "AS", "#00D68F", 1],
    ["3", "Pedro Rocha", "Podemos marcar uma demo na próxima semana?", "Ontem", 1, "PR", "#6C63FF", 0],
    ["4", "Mariana Lima", "Vou falar com meu sócio e te retorno.", "Seg", 0, "ML", "#FF0080", 0],
    ["5", "Roberto Costa", "Contrato assinado! Obrigado pela atenção.", "Dom", 0, "RC", "#FFB300", 0],
  ] as const;

  for (const [id, contact_name, last_message, time_label, unread, initials, avatar_color, is_online] of conversations) {
    await db.runAsync(
      `INSERT INTO conversations (id, contact_name, last_message, time_label, unread, initials, avatar_color, is_online)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, contact_name, last_message, time_label, unread, initials, avatar_color, is_online]
    );
  }

  const messages = [
    ["m1", "1", "Olá! Vi sobre o plano Enterprise e tenho interesse em saber mais.", "them", "10:20", 1],
    ["m2", "1", "Oi Carlos! Ótimo que entrou em contato. Posso te contar mais sobre nossas soluções?", "me", "10:21", 1],
    ["m3", "1", "Sim, gostaria de saber sobre preços e integrações disponíveis.", "them", "10:22", 1],
    ["m4", "1", "Claro! O plano Enterprise inclui integrações ilimitadas, suporte 24/7 e implementação dedicada.", "me", "10:23", 1],
    ["m5", "1", "Qual o valor mensal? Preciso apresentar para minha diretoria.", "them", "10:24", 0],
    ["m6", "2", "Bom dia! Conseguiu analisar nossa proposta?", "me", "09:10", 1],
    ["m7", "2", "Bom dia! Sim, achei muito interessante. Os números fazem sentido.", "them", "09:12", 1],
    ["m8", "2", "Excelente! Posso agendar uma call para esta semana?", "me", "09:13", 1],
    ["m9", "2", "Perfeito! Vou encaminhar para o financeiro hoje.", "them", "09:15", 1],
    ["m10", "3", "Pedro, queria saber se teve chance de ver nosso material.", "me", "Ontem 14:30", 1],
    ["m11", "3", "Sim, vi! A plataforma parece muito robusta.", "them", "Ontem 15:00", 1],
    ["m12", "3", "Podemos marcar uma demo na próxima semana?", "them", "Ontem 15:02", 0],
    ["m13", "4", "Mariana, como posso te ajudar hoje?", "me", "Seg 11:00", 1],
    ["m14", "4", "Vou falar com meu sócio e te retorno.", "them", "Seg 11:30", 1],
    ["m15", "5", "Roberto, a proposta foi aprovada?", "me", "Dom 09:00", 1],
    ["m16", "5", "Contrato assinado! Obrigado pela atenção.", "them", "Dom 09:30", 1],
  ] as const;

  for (const [id, conversation_id, text, sender, time_label, read] of messages) {
    await db.runAsync(
      `INSERT INTO messages (id, conversation_id, text, sender, time_label, read)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, conversation_id, text, sender, time_label, read]
    );
  }
}
