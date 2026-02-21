async function generateText(ai, messages, model = "@cf/meta/llama-3-8b-instruct") {
  try {
    const response = await ai.run(model, {
      messages,
      max_tokens: 1024,
      temperature: 0.7
    });
    return response.response || "";
  } catch (error) {
    console.error("Workers AI error:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`AI 生成失败: ${message}`, { cause: error });
  }
}
export {
  generateText
};
