export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const imageBase64 = body.image;

  const openaiKey = env.OPENAI_API_KEY;
  const deepseekKey = env.DEEPSEEK_API_KEY;

  // ======= 调用 OpenAI =======
  async function callOpenAI() {
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
            { role: "system", content: "Identify the bird from the image." },
            {
              role: "user",
              content: [
                { type: "text", text: "Identify this bird" },
                { type: "image_url", image_url: imageBase64 }
              ]
            }
          ]
        })
      });

      const text = await res.text();

      // 如果 OpenAI 返回 insufficient_quota → 触发 fallback
      if (text.includes("insufficient_quota") || res.status === 429) {
        return null;  
      }

      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  // ======= 调用 DeepSeek =======
  async function callDeepSeek() {
    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${deepseekKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "Identify the bird from the image." },
            {
              role: "user",
              content:
                "This is a bird image encoded in Base64. Identify the bird species:\n\n" +
                imageBase64
            }
          ]
        })
      });

      return await res.json();
    } catch (err) {
      return { error: "DeepSeek request failed", detail: err.toString() };
    }
  }

  // ======= 主流程：先 OpenAI → fallback DeepSeek =======
  let result = null;

  if (openaiKey) {
    result = await callOpenAI();
  }

  // 如果 OpenAI 返回 null（失败或无额度）→ 用 DeepSeek
  if (!result && deepseekKey) {
    result = await callDeepSeek();
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
