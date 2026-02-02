import alchemy from "alchemy";
import { SvelteKit } from "alchemy/cloudflare";

const app = await alchemy("parley", {
  phase: process.argv.includes("--destroy") ? "destroy" : "up",
});

export const APP = await SvelteKit("parley-app", {
  name: "parley-app",
  domains: ["parley.coey.dev"],
  url: true,
  adopt: true,
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  }
});

console.log({ url: APP.url });

await app.finalize();
