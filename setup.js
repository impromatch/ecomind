const https = require("https");
module.exports = async function(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { topic, count, lang } = req.body || {};
    if (!topic) return res.status(400).json({ error: "topic required" });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

    const langInstr = lang === "tr"
      ? "Sorular Türkçe olsun."
      : "Questions must be in English.";

    const prompt = `Generate ${count||5} quiz questions about "${topic}" for high school students. ${langInstr} Reply ONLY in this JSON format: {"questions":[{"q":"question","opts":["A","B","C","D"],"c":0,"ex":"explanation"}]}`;

    const body = JSON.stringify({ model:"claude-haiku-4-5-20251001", max_tokens:1200, messages:[{role:"user",content:prompt}] });

    const result = await new Promise(function(resolve, reject) {
      const r = https.request({
        hostname:"api.anthropic.com", path:"/v1/messages", method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","Content-Length":Buffer.byteLength(body)}
      }, function(resp) {
        let d=""; resp.on("data",function(c){d+=c;}); resp.on("end",function(){resolve({status:resp.statusCode,body:d});});
      });
      r.on("error",reject); r.write(body); r.end();
    });

    const data = JSON.parse(result.body);
    if (result.status!==200) return res.status(500).json({ error: data.error?.message||"API error" });
    const txt = (data.content||[]).filter(function(b){return b.type==="text";}).map(function(b){return b.text;}).join("").trim();
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return res.status(500).json({ error: "Invalid response" });
    const parsed = JSON.parse(m[0]);
    return res.status(200).json({ questions: parsed.questions||[] });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
