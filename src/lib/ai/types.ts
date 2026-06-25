export interface AiProvider {
  complete(systemPrompt: string, userPrompt: string): Promise<string>;
  completeStream?(systemPrompt: string, userPrompt: string): Promise<ReadableStream<Uint8Array>>;
}
