// api/chat.js — Proxy Claude Haiku con pregunta obligatoria de quién ejecuta
module.exports = async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
 
  const msgs    = req.body.messages || [];
  const system  = req.body.system   || "";
  const allText = msgs.map(m => m.content).join(" ").toLowerCase();
 
  // Detectar si ya se sabe quién ejecuta en el historial
  const hasExecutor = /\bmantenimiento\b|\bmaintenance\b|\b1\b|\btech\b|\bot&a\b|\bota\b|\btecnolog/.test(allText);
 
  let finalMessages = msgs;
 
  // Si es el primer mensaje y aún no se sabe quién ejecuta,
  // inyectar la pregunta obligatoria como primera respuesta del asistente
  if (msgs.length === 1 && !hasExecutor) {
    finalMessages = [
      msgs[0],
      {
        role: "assistant",
        content: "¿Quién emite el requerimiento de compra?\n1. Área de Mantenimiento\n2. Área de TECH/OT"
      }
    ];
    // Return the question directly without calling Claude
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    const text = "¿Quién emite el requerimiento de compra?\n1. Área de Mantenimiento\n2. Área de TECH/OT";
    res.write(`data: ${JSON.stringify({ type:"content_block_delta", delta:{ type:"text_delta", text } })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }
 
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 800,
        stream:     true,
        system,
        messages:   finalMessages,
      }),
    });
 
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json(err);
    }
 
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
 
    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
