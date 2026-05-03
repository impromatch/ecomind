const { getPool } = require("./_db");
const CORS = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};

module.exports = async function(req, res) {
  Object.entries(CORS).forEach(([k,v]) => res.setHeader(k,v));
  if (req.method === "OPTIONS") return res.status(200).end();
  const db = getPool();
  try {
    if (req.method === "GET") {
      const { id, code } = req.query;
      if (id) {
        const r = await db.query("SELECT * FROM eco_groups WHERE id=$1", [id]);
        return res.status(200).json(r.rows[0] || null);
      }
      if (code) {
        const r = await db.query("SELECT * FROM eco_groups WHERE code=$1", [code.toUpperCase()]);
        return res.status(200).json(r.rows[0] || null);
      }
      return res.status(400).json({ error: "id or code required" });
    }
    if (req.method === "POST") {
      const g = req.body;
      await db.query(`
        INSERT INTO eco_groups (id,name,code,creator,creator_id,members,scores,topic,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET
          members=EXCLUDED.members, scores=EXCLUDED.scores,
          topic=EXCLUDED.topic, status=EXCLUDED.status
      `, [g.id,g.name,g.code,g.creator,g.creatorId,
          JSON.stringify(g.members||[]),JSON.stringify(g.scores||{}),
          g.topic||"karma",g.status||"waiting"]);
      const r = await db.query("SELECT * FROM eco_groups WHERE id=$1", [g.id]);
      return res.status(200).json(r.rows[0]);
    }
    if (req.method === "PATCH") {
      const { id, members, scores, status, topic } = req.body;
      const sets=[]; const vals=[id]; let i=2;
      if (members!==undefined){sets.push(`members=$${i++}`);vals.push(JSON.stringify(members));}
      if (scores!==undefined){sets.push(`scores=$${i++}`);vals.push(JSON.stringify(scores));}
      if (status){sets.push(`status=$${i++}`);vals.push(status);}
      if (topic){sets.push(`topic=$${i++}`);vals.push(topic);}
      if (sets.length) await db.query(`UPDATE eco_groups SET ${sets.join(",")} WHERE id=$1`, vals);
      const r = await db.query("SELECT * FROM eco_groups WHERE id=$1", [id]);
      return res.status(200).json(r.rows[0]);
    }
    return res.status(405).end();
  } catch(e) {
    console.error("group api:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
