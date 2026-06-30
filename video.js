// netlify/functions/generate-video.js
// Replicate API - Text to Video (Stable Video Diffusion / Wan-2.1)

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // OPTIONS preflight handle
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { prompt, duration = 3, style = "cinematic" } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Prompt chahincha!" }),
      };
    }

    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "REPLICATE_API_TOKEN configure bhayeko chaina." }),
      };
    }

    // Enhanced prompt based on style
    const stylePrompts = {
      "Cinematic": "cinematic, 4K, film grain, dramatic lighting, professional cinematography",
      "Anime": "anime style, vibrant colors, Japanese animation, Studio Ghibli inspired",
      "Realistic": "photorealistic, ultra detailed, 8K, professional camera",
      "Time-lapse": "time-lapse photography, smooth motion, nature documentary style",
      "Slow Motion": "slow motion, high frame rate, smooth, detailed, beautiful",
    };

    const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts["Cinematic"]}`;

    // Step 1: Prediction create garnus (Wan-2.1 model — text to video)
    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        // Wan-2.1 — fast, good quality text-to-video
        version: "wanvideo-wan-2-1-t2v-480p",
        input: {
          prompt: enhancedPrompt,
          num_frames: duration * 8, // 8 frames per second
          guidance_scale: 7.5,
          num_inference_steps: 25,
        },
      }),
    });

    if (!createResponse.ok) {
      const err = await createResponse.json().catch(() => ({}));
      return {
        statusCode: createResponse.status,
        headers,
        body: JSON.stringify({ error: err.detail || "Video generation start garna sakena." }),
      };
    }

    const prediction = await createResponse.json();

    // Step 2: Prediction ID return garnus — frontend le poll garcha
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        prediction_id: prediction.id,
        status: prediction.status,
        message: "Video generation suru bhayo! Status check garnus.",
      }),
    };

  } catch (err) {
    console.error("Video function error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error: " + err.message }),
    };
  }
};
