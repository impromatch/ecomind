const { getPool } = require("./_db");
module.exports = async function(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const db = getPool();
    const r = await db.query(
      "SELECT name,avatar,total_score,games_played,best_score,updated_at FROM eco_users ORDER BY total_score DESC LIMIT 30"
    );
    return res.status(200).json(r.rows);
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
