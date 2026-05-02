module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { topic, count } = req.body || {};
    if (!topic) return res.status(400).json({ error: "topic gerekli" });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY ayarlanmamis" });

    const prompt = "Lise ogrencileri icin " + topic + " konusunda " + (count || 5) + " adet Turkce bilgi yarismasi sorusu hazirla. YALNIZCA su JSON formatinda yaz: {\"questions\":[{\"q\":\"soru\",\"opts\":[\"A\",\"B\",\"C\",\"D\"],\"c\":0,\"ex\":\"aciklama\"}]}";

    const https = require("https");

    const body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }]
    });

    const result = await new Promise(function(resolve, reject) {
      const options = {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(body)
        }
      };
      const request = https.request(options, function(response) {
        let data = "";
        response.on("data", function(chunk) { data += chunk; });
        response.on("end", function() { resolve({ status: response.statusCode, body: data }); });
      });
      request.on("error", reject);
      request.write(body);
      request.end();
    });

    const data = JSON.parse(result.body);
    if (result.status !== 200) return res.status(500).json({ error: data.error && data.error.message ? data.error.message : "API hatasi" });

    const txt = (data.content || []).filter(function(b) { return b.type === "text"; }).map(function(b) { return b.text; }).join("").trim();
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return res.status(500).json({ error: "Gecersiz yanit formati" });

    const parsed = JSON.parse(m[0]);
    return res.status(200).json({ questions: parsed.questions || [] });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
