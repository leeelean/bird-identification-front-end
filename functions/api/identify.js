export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const image = body.image;

  const apikey = env.OPENAI_API_KEY;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apikey}`,
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
            { type: "image_url", image_url: image }
          ]
        }
      ]
    })
  });

  const result = await response.json();

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
}
