export async function callGroqAPI(
  prompt: string,
  apiKey: string,
  modelId = 'deepseek-r1-distill-llama-70b',
  mode: 'default' | 'audio' = 'default'
): Promise<string> {
  const startTime = Date.now();

  if (!apiKey) {
    throw new Error("GROQ_API_KEY not provided");
  }


    const systemPrompt = mode === 'audio'
  ? `Imagina que eres un profesor explicando en voz alta a un estudiante. Habla con un tono directo y claro, como si grabaras un podcast educativo. Demuestra paso a paso. Usa frases como "la raíz cuadrada de x" en vez de símbolos LaTeX. Evita etiquetas HTML.`
  : `Genera una demostración correcta usando expresiones como $\sqrt{x}$ o $\sqrt[n]{x}$ o $\lim_{x \to 0} x$ o $\sin(x)$ o $\cos(x)$ o $\log{x}$ o $\frac{a}{b}$ según corresponda`;


  const requestBody = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: prompt },
    ],
    model: 'deepseek-r1-distill-llama-70b',      // uso dinámico
    max_tokens: 4092,    // debe coincidir con tu log
    temperature: 0.7,
  };

  console.log("🤖 GROQ API Call Starting... desde GROQAPI.TS");
  console.log(`📝 Prompt length: ${prompt.length} characters`);
  console.log(`📊 Request config: model=deepseek-r1-distill-llama-70b, max_tokens=${requestBody.max_tokens}`);
  console.log("🌐 Sending request to GROQ…");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const elapsed = Date.now() - startTime;
  if (!res.ok) {
    const errData = await res.json();
    console.error(`❌ GROQ API Error ${res.status}:`, errData);
    throw new Error(`GROQ API error (${res.status}): ${JSON.stringify(errData)}`);
  }

  const { choices } = await res.json();
  const content = choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in GROQ API response");
  }

  console.log(`✅ GROQ API Success in ${elapsed}ms, response length: ${content.length}`);
  return content.trim();
}
