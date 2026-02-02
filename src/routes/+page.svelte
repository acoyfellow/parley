<script lang="ts">
  import { onMount } from 'svelte';
  import ModelSelector from '$lib/components/ModelSelector.svelte';
  import PlanningView from '$lib/components/PlanningView.svelte';
  import { usePlanningStore } from '$lib/stores/planning.svelte';

  interface Model {
    id: string;
    name: string;
    contextLength: number;
    pricing: { prompt: string; completion: string };
  }

  let models = $state<Model[]>([]);
  let loadingModels = $state(true);
  let modelsError = $state<string | null>(null);

  const store = usePlanningStore();

  // Computed values for selected model names
  const modelAName = $derived(
    models.find(m => m.id === store.state.modelA)?.name || 'Agent A'
  );
  const modelBName = $derived(
    models.find(m => m.id === store.state.modelB)?.name || 'Agent B'
  );

  onMount(async () => {
    try {
      const res = await fetch('/api/models');
      if (!res.ok) throw new Error('Failed to fetch models');
      const data = await res.json() as { models: Model[] };
      models = data.models;
    } catch (e) {
      modelsError = e instanceof Error ? e.message : 'Failed to load models';
    } finally {
      loadingModels = false;
    }
  });

  function handleStart() {
    store.start();
  }

  function handleStop() {
    store.stop();
  }

  function handleReset() {
    store.reset();
  }

  function handleIntervene(input: string) {
    store.intervene(input);
  }

  const canStart = $derived(
    store.state.prompt.trim() &&
    store.state.modelA &&
    store.state.modelB &&
    store.state.status !== 'planning'
  );
</script>

<svelte:head>
  <title>Parley - Dual AI Planning</title>
  <meta name="description" content="Two AI models debate until they agree on a plan. Collaborative planning with real-time streaming." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="min-h-screen bg-white">
  <!-- Header -->
  <header class="border-b-2 border-black">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold font-mono uppercase tracking-wider">
            Parley
          </h1>
          <p class="text-gray-600 font-mono text-sm mt-1">
            Two AI models debate until they agree on a plan
          </p>
        </div>
        <a
          href="https://github.com/acoyfellow/parley"
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-2 border-2 border-black font-mono text-sm hover:bg-black hover:text-white transition-colors"
        >
          GitHub
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-8">
    {#if store.state.status === 'idle' || store.state.status === 'configuring'}
      <!-- Configuration View -->
      <div class="max-w-2xl mx-auto">
        <!-- Hero -->
        <div class="text-center mb-12">
          <div class="inline-block p-4 bg-yellow-100 border-2 border-black mb-6">
            <p class="font-mono text-sm">
              Select two AI models, enter what you want to plan,
              <br />and watch them collaborate until they agree.
            </p>
          </div>
        </div>

        <!-- Configuration Form -->
        <div class="bg-white border-2 border-black p-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <h2 class="text-xl font-bold font-mono uppercase mb-6">Configure Your Planning Session</h2>

          <!-- Model Selection -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {#if loadingModels}
              <div class="col-span-2 text-center py-8 text-gray-500 font-mono">
                Loading models...
              </div>
            {:else if modelsError}
              <div class="col-span-2 text-center py-8 text-red-500 font-mono">
                {modelsError}
              </div>
            {:else}
              <ModelSelector
                {models}
                value={store.state.modelA}
                onchange={(id) => store.configure({ modelA: id })}
                label="Agent A (Proposer)"
              />
              <ModelSelector
                {models}
                value={store.state.modelB}
                onchange={(id) => store.configure({ modelB: id })}
                label="Agent B (Critic)"
              />
            {/if}
          </div>

          <!-- Prompt Input -->
          <div class="mb-8">
            <label for="planning-prompt" class="block text-sm font-mono uppercase tracking-wider mb-2 text-gray-600">
              What do you want to plan?
            </label>
            <textarea
              id="planning-prompt"
              value={store.state.prompt}
              oninput={(e) => store.configure({ prompt: e.currentTarget.value })}
              placeholder="Describe what you want to plan in detail. The more context you provide, the better the plan will be..."
              rows="6"
              class="w-full px-4 py-3 border-2 border-black font-mono text-sm
                     resize-none focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            ></textarea>
          </div>

          <!-- Start Button -->
          <button
            onclick={handleStart}
            disabled={!canStart}
            class="w-full py-4 bg-black text-white font-mono font-bold uppercase text-lg
                   hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
          >
            Start Planning
          </button>

          <!-- How it works -->
          <div class="mt-8 pt-8 border-t-2 border-gray-200">
            <h3 class="font-mono font-bold uppercase text-sm mb-4">How it works</h3>
            <ol class="space-y-3 font-mono text-sm text-gray-600">
              <li class="flex gap-3">
                <span class="bg-black text-white w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                <span>Agent A proposes an initial plan based on your prompt</span>
              </li>
              <li class="flex gap-3">
                <span class="bg-black text-white w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                <span>Agent B critiques the plan and suggests improvements</span>
              </li>
              <li class="flex gap-3">
                <span class="bg-black text-white w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                <span>They go back and forth until both agree on the plan</span>
              </li>
              <li class="flex gap-3">
                <span class="bg-black text-white w-6 h-6 flex items-center justify-center flex-shrink-0">4</span>
                <span>You can intervene anytime to steer the conversation</span>
              </li>
            </ol>
          </div>
        </div>

        <!-- Features -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div class="border-2 border-black p-6">
            <h3 class="font-mono font-bold uppercase mb-2">Any Model</h3>
            <p class="text-sm text-gray-600">
              Choose from 300+ models via OpenRouter. Mix and match different providers.
            </p>
          </div>
          <div class="border-2 border-black p-6">
            <h3 class="font-mono font-bold uppercase mb-2">Real-time Streaming</h3>
            <p class="text-sm text-gray-600">
              Watch the agents think and respond in real-time with streaming output.
            </p>
          </div>
          <div class="border-2 border-black p-6">
            <h3 class="font-mono font-bold uppercase mb-2">Human in the Loop</h3>
            <p class="text-sm text-gray-600">
              Intervene anytime to provide context, steer direction, or ask questions.
            </p>
          </div>
        </div>
      </div>
    {:else}
      <!-- Planning View -->
      <div class="h-[calc(100vh-200px)] border-2 border-black">
        <PlanningView
          state={store.state}
          {modelAName}
          {modelBName}
          onstop={handleStop}
          onintervene={handleIntervene}
          onreset={handleReset}
        />
      </div>
    {/if}
  </main>

  <!-- Footer -->
  <footer class="border-t-2 border-black mt-16">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between font-mono text-sm text-gray-600">
        <p>Built with SvelteKit + Cloudflare Workers</p>
        <p>
          <a href="https://coey.dev" class="hover:text-black">coey.dev</a>
        </p>
      </div>
    </div>
  </footer>
</div>
