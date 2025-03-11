declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ANTHROPIC_API_KEY: string;
      COHERE_API_KEY: string;
      CHROMA_URL?: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
}

export {};
