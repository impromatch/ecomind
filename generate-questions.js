const { getPool } = require("./_db");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

module.exports = async function(req, res) {
  Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v));
  if (req.method === "OPTIONS") return res.status(200).end();

  const db = getPool();

  try {
    // GET - kullanici getir
    if (req.method === "GET") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "id required" });
      const r = await db.query("SELECT * FROM eco_users WHERE id=$1", [id]);
      return res.status(200).json(r.rows[0] || null);
    }

    // POST - kayit / upsert
    if (req.method === "POST") {
      const u = req.body;
      await db.query(`
        INSERT INTO eco_users (id,name,email,phone,avatar,theme,lang,total_score,games_played,best_score,categories,joined_group,used_ai,played_tournament)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (id) DO UPDATE SET
          name=EXCLUDED.name, avatar=EXCLUDED.avatar, theme=EXCLUDED.theme, lang=EXCLUDED.lang,
          updated_at=NOW()
      `, [u.id,u.name,u.email||"",u.phone||"",u.avatar||"🧑‍💻",u.theme||"nature",u.lang||"en",
          u.totalScore||0,u.gamesPlayed||0,u.bestScore||0,
          u.categories||[],u.joinedGroup||false,u.usedAI||false,u.playedTournament||false]);
      const r = await db.query("SELECT * FROM eco_users WHERE id=$1", [u.id]);
      return res.status(200).json(r.rows[0]);
    }

    // PATCH - skor guncelle
    if (req.method === "PATCH") {
      const { id, score, category, usedAI, joinedGroup, playedTournament, theme, lang, avatar, name } = req.body;
      if (!id) return res.status(400).json({ error: "id required" });

      const sets = ["updated_at=NOW()"];
      const vals = [id];
      let i = 2;

      if (score !== undefined) {
        sets.push(`total_score=total_score+$${i++}`, `games_played=games_played+1`, `best_score=GREATEST(best_score,$${i++})`);
        vals.push(score, score);
      }
      if (category) { sets.push(`categories=array_append(categories,$${i++})`); vals.push(category); }
      if (usedAI !== undefined) { sets.push(`used_ai=$${i++}`); vals.push(usedAI); }
      if (joinedGroup !== undefined) { sets.push(`joined_group=$${i++}`); vals.push(joinedGroup); }
      if (playedTournament !== undefined) { sets.push(`played_tournament=$${i++}`); vals.push(playedTournament); }
      if (theme) { sets.push(`theme=$${i++}`); vals.push(theme); }
      if (lang) { sets.push(`lang=$${i++}`); vals.push(lang); }
      if (avatar) { sets.push(`avatar=$${i++}`); vals.push(avatar); }
      if (name) { sets.push(`name=$${i++}`); vals.push(name); }

      await db.query(`UPDATE eco_users SET ${sets.join(",")} WHERE id=$1`, vals);
      const r = await db.query("SELECT * FROM eco_users WHERE id=$1", [id]);
      return res.status(200).json(r.rows[0]);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch(e) {
    console.error("user api:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
