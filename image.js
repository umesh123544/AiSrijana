// netlify/functions/generate-image.js
// Stability AI - Text to Image Generation

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // CORS headers - sabai browser bata call garna milcha
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const body = JSON.parse(event.body || "{}");
    const {
      prompt,
      negative_prompt = "blurry, ugly, watermark, low quality, distorted, deformed",
      style = "photographic",
      width = 1024,
      height = 1024,
      steps = 30,
      cfg_scale = 7,
    } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Prompt chahincha!" }),
      };
    }

    // Stability AI API Key — Netlify Environment Variable bata lincha
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "API key configure bhayeko chaina. Netlify dashboard ma STABILITY_API_KEY add garnus." }),
      };
    }

    // Style preset mapping
    const stylePresets = {
      "Realistic (Saccho jasto)": "photographic",
      "Anime / Cartoon": "anime",
      "Oil Painting": "oil-painting",
      "3D Render": "3d-model",
      "Pencil Sketch": "line-art",
      "Cinematic": "cinematic",
      "Watercolor": "watercolor",
      "Abstract Art": "digital-art",
    };

    const stylePreset = stylePresets[style] || "photographic";

    // Stability AI SDXL API call
    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            { text: prompt, weight: 1 },
            { text: negative_prompt, weight: -1 },
          ],
          cfg_scale,
          height,
          width,
          steps,
          samples: 1,
          style_preset: stylePreset,
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Stability AI error:", errData);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: errData.message || "Image generation fail bhayo. Pheri try garnus.",
        }),
      };
    }

    const data = await response.json();

    // Base64 image return garchau
    const imageBase64 = data.artifacts?.[0]?.base64;
    if (!imageBase64) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Image generate bhayena. Pheri try garnus." }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        image: `data:image/png;base64,${imageBase64}`,
        seed: data.artifacts?.[0]?.seed,
      }),
    };

  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error: " + err.message }),
    };
  }
};
