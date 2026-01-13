export async function onRequestPost(context) {
  const body = await context.request.json();
  const image = body.image;

  const apiKey = context.env.OPENAI_API_KEY;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
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

  const text = await response.text();
  return new Response(text, {
    headers: { "Content-Type": "application/json" }
  });
}

