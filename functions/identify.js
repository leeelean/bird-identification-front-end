export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const image = body.image;

  // 环境变量
  const geminiKey = env.GEMINI_API_KEY;
  const deepseekKey = env.DEEPSEEK_API_KEY;
  const openaiKey = env.OPENAI_API_KEY;

  // -----------------------------------------------------
  // 1️⃣ Gemini（优先。免费且可靠）
  // -----------------------------------------------------
  if (geminiKey) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: "Identify the bird species in this image." },
                  { inline_data: { mime_type: "image/jpeg", data: image } }
                ]
              }
            ]
          })
        }
      );

      const json = await res.json();

      if (json?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return new Response(
          JSON.stringify({ model: "gemini", result: json }, null, 2),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (err) {
      console.log("Gemini failed → fallback", err);
    }
  }

  // -----------------------------------------------------
  // 2️⃣ DeepSeek（图像能力不如 Gemini，但能当备份）
  // -----------------------------------------------------
  if (deepseekKey) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${deepseekKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "Identify the bird species from the image. Describe the species in detail." },
            {
              role: "user",
              content: [
                { type: "text", text: "Identify this bird" },
                { type: "image_url", image_url: image }
              ]
            }
          ]
        })
      });

      const json = await res.json();

      // deepseek 不一定成功识图，但如果返回内容，我们就认
      if (json?.choices?.[0]?.message?.content) {
        return new Response(
          JSON.stringify({ model: "deepseek", result: json }, null, 2),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (err) {
      console.log("DeepSeek failed → fallback", err);
    }
  }

  // -----------------------------------------------------
  // 3️⃣ OpenAI（最终兜底）
  // -----------------------------------------------------
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Identify the bird species from the image." },
            {
              role: "user",
              content: [
                { type: "text", text: "Identify this bird." },
                { type: "image_url", image_url: image }
              ]
            }
          ]
        })
      });

      const text = await res.text();
      return new Response(text, {
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      console.log("OpenAI failed", err);
    }
  }

  // -----------------------------------------------------
  // 4️⃣ 全部失败
  // -----------------------------------------------------
  return new Response(
    JSON.stringify({ error: "All AI providers failed." }, null, 2),
    { headers: { "Content-Type": "application/json" }, status: 500 }
  );
}
