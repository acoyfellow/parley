/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace App {
    interface Platform {
      env: {
        OPENROUTER_API_KEY: string;
      };
      context: ExecutionContext;
      caches: CacheStorage;
    }
  }
}

export {};
