// Replicate API - Text to Video
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
        body: JSON.stringify({ 
          error: "REPLICATE_API_TOKEN configure bhayeko chaina. Netlify dashboard ma add garnus." 
        }),
      };
    }

    const stylePrompts = {
      "Cinematic": "cinematic, 4K, film grain, dramatic lighting, professional cinematography, smooth motion",
      "Anime": "anime style, vibrant colors, Japanese animation, Studio Ghibli inspired, smooth animation",
      "Realistic": "photorealistic, ultra detailed, 8K, professional camera, natural lighting",
      "Time-lapse": "time-lapse photography, smooth motion, nature documentary style, flowing",
      "Slow Motion": "slow motion, high frame rate, smooth, detailed, beautiful, fluid motion",
    };

    const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts["Cinematic"]}`;

    // Stable Video Diffusion model
    const modelVersion = "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438";

    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          prompt: enhancedPrompt,
          frames_per_second: 8,
          motion_bucket_id: 127,
          cond_aug: 0.02,
          decoding_t: 7,
          seed: Math.floor(Math.random() * 1000000),
        },
      }),
    });

    if (!createResponse.ok) {
      const err = await createResponse.json().catch(() => ({}));
      console.error('Replicate create error:', err);
      return {
        statusCode: createResponse.status,
        headers,
        body: JSON.stringify({ 
          error: err.detail || "Video generation start garna sakena." 
        }),
      };
    }

    const prediction = await createResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        prediction_id: prediction.id,
        status: prediction.status,
        message: "Video generation suru bhayo!",
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
