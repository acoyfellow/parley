import alchemy from "alchemy";
import { SvelteKit } from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";

const app = await alchemy("parley", {
  phase: process.argv.includes("--destroy") ? "destroy" : "up",
  stateStore: (scope) => new CloudflareStateStore(scope),
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

const prNumber = Number(process.env.PULL_REQUEST || "");
if (prNumber) {
  await GitHubComment("preview-comment", {
    owner: "acoyfellow",
    repository: "parley",
    issueNumber: prNumber,
    body: `## Preview Deployed\n\nYour changes have been deployed to a preview environment:\n\n**Website:** ${APP.url}\n\nBuilt from commit ${process.env.GITHUB_SHA?.slice(0, 7)}\n\n---\n\n<sub>This comment updates automatically with each push.</sub>`,
  });
}

await app.finalize();
