export async function callGroqAPI(prompt: string, apiKey: string, modelId: string = 'llama-3.1-8b-instant'): Promise<string> {
  const startTime = Date.now();

  try {
    console.log("🤖 GROQ API Call Starting...");
    console.log(`📝 Prompt length: ${prompt.length} characters`);
                                                          
    if (!apiKey) {
      throw new Error("GROQ_API_KEY not provided");
    }

    const selectedModel = modelId;

      const systemPrompt = `Genera una demostración en LaTeX usando expresiones como $\sqrt{x} + \sqrt[3]{x} + \lim_{x \to 0} x + \sin(x) + \cos(x) + \log{x} + \frac{a}{b}$. Si la respuesta contiene “**” o símbolos incompletos, no la envíes. Adáptala al nivel del estudiante y proporciona ejemplos claros. Evalúa tu respuesta según:
      1. Partes de toda demostración:
  a) Hipótesis
  b) Tesis
  c) Cadena de implicaciones
  d) Cierre
      2. Tipos de prueba: directa, contraposición, contradicción y recíproco.
      3. Conectores lógicos: “Entonces”, “Por tanto”, “Por…”.
      4. Resumen de la receta final. Sé claro, conciso y pedagógico. Eres asistente experto en matemáticas adaptativas. Usa LaTeX siempre correctamente.`;

    const requestBody = {
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: 'deepseek-r1-distill-llama-70b',
      max_tokens: 4096,
      temperature: 0.7,
    };

    console.log(`📊 Request config: ${selectedModel}, max_tokens: 1000`);
    console.log("🌐 Sending request to GROQ...");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Response received in ${responseTime}ms`);

    if (!response.ok) {
      const errorData = await response.json();
      console.log(`❌ GROQ API Error ${response.status}: ${JSON.stringify(errorData)}`);
      throw new Error(`GROQ API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in GROQ API response");
    }

    console.log(`✅ GROQ API Success in ${responseTime}ms`);
    console.log(`📄 Response length: ${content.length} characters`);

    return content.trim();
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`❌ GROQ API Error after ${errorTime}ms: ${error.message}`);
    throw error;
  }
}
