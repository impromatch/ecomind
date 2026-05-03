const { getPool } = require("./_db");

module.exports = async function(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Güvenlik: sadece GET ile ve secret key ile çalışsın
  const { secret } = req.query;
  if (secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: "Forbidden. Add ?secret=YOUR_SECRET to URL" });
  }

  const db = getPool();
  const results = [];

  try {
    // 1. Users tablosu
    await db.query(`
      CREATE TABLE IF NOT EXISTS eco_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        avatar TEXT DEFAULT '🧑‍💻',
        theme TEXT DEFAULT 'nature',
        lang TEXT DEFAULT 'en',
        total_score INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        categories TEXT[] DEFAULT '{}',
        joined_group BOOLEAN DEFAULT false,
        used_ai BOOLEAN DEFAULT false,
        played_tournament BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("✅ eco_users tablosu hazır");

    // 2. Groups tablosu
    await db.query(`
      CREATE TABLE IF NOT EXISTS eco_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        creator TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        members JSONB DEFAULT '[]',
        scores JSONB DEFAULT '{}',
        topic TEXT DEFAULT 'karma',
        status TEXT DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("✅ eco_groups tablosu hazır");

    // 3. İndeksler
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_score ON eco_users(total_score DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_groups_code ON eco_groups(code)`);
    results.push("✅ İndeksler hazır");

    // 4. Trigger
    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql
    `);
    await db.query(`
      DROP TRIGGER IF EXISTS eco_users_updated_at ON eco_users;
      CREATE TRIGGER eco_users_updated_at
        BEFORE UPDATE ON eco_users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    `);
    results.push("✅ Trigger hazır");

    // 5. Test
    const test = await db.query("SELECT COUNT(*) FROM eco_users");
    results.push(`✅ Test başarılı — eco_users: ${test.rows[0].count} kayıt`);

    return res.status(200).json({
      success: true,
      message: "🎉 Veritabanı kurulumu tamamlandı!",
      results
    });

  } catch(e) {
    return res.status(500).json({
      success: false,
      error: e.message,
      results
    });
  }
};
