// netlify/functions/generate-image/generate-image.js
// Stability AI - Text to Image Generation

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }) 
    };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const {
      prompt,
      negative_prompt = "blurry, ugly, watermark, low quality, distorted, deformed",
      style = "photographic",
      width = 1024,
      height = 1024,
      steps = 30,
      quality = "standard",
    } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Prompt chahincha!" }),
      };
    }

    // Stability AI API Key
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "STABILITY_API_KEY configure bhayeko chaina. Netlify dashboard ma add garnus." 
        }),
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
    
    // HD quality ko lagi higher steps
    const finalSteps = quality === 'hd' ? Math.max(steps, 40) : steps;

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
          cfg_scale: 7,
          height,
          width,
          steps: finalSteps,
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
