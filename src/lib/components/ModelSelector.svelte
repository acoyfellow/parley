<script lang="ts">
  interface Model {
    id: string;
    name: string;
    contextLength: number;
    pricing: { prompt: string; completion: string };
  }

  interface Props {
    models: Model[];
    value: string | null;
    onchange: (modelId: string) => void;
    label: string;
    disabled?: boolean;
  }

  let { models, value, onchange, label, disabled = false }: Props = $props();

  let searchQuery = $state('');
  let isOpen = $state(false);

  const filteredModels = $derived(
    models.filter(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const selectedModel = $derived(models.find(m => m.id === value));

  function selectModel(modelId: string) {
    onchange(modelId);
    isOpen = false;
    searchQuery = '';
  }

  function formatContext(length: number): string {
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
    return String(length);
  }
</script>

<div class="relative">
  <span id="model-label-{label.replace(/\s+/g, '-').toLowerCase()}" class="block text-sm font-mono uppercase tracking-wider mb-2 text-gray-600">
    {label}
  </span>

  <button
    type="button"
    {disabled}
    onclick={() => isOpen = !isOpen}
    aria-labelledby="model-label-{label.replace(/\s+/g, '-').toLowerCase()}"
    class="w-full px-4 py-3 border-2 border-black bg-white text-left font-mono
           hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
           focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
           transition-colors"
  >
    {#if selectedModel}
      <span class="block truncate">{selectedModel.name}</span>
      <span class="block text-xs text-gray-500 mt-1">
        {formatContext(selectedModel.contextLength)} context
      </span>
    {:else}
      <span class="text-gray-400">Select a model...</span>
    {/if}
  </button>

  {#if isOpen && !disabled}
    <div class="absolute z-50 w-full mt-1 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-h-80 overflow-hidden">
      <div class="p-2 border-b-2 border-black">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search models..."
          class="w-full px-3 py-2 border-2 border-gray-300 font-mono text-sm
                 focus:border-black focus:outline-none"
        />
      </div>

      <div class="max-h-64 overflow-y-auto">
        {#each filteredModels as model (model.id)}
          <button
            type="button"
            onclick={() => selectModel(model.id)}
            class="w-full px-4 py-3 text-left hover:bg-yellow-100 border-b border-gray-100
                   {value === model.id ? 'bg-yellow-50' : ''}"
          >
            <span class="block font-mono text-sm truncate">{model.name}</span>
            <span class="block text-xs text-gray-500 mt-1">
              {model.id} · {formatContext(model.contextLength)} context
            </span>
          </button>
        {:else}
          <div class="px-4 py-3 text-gray-500 text-sm">No models found</div>
        {/each}
      </div>
    </div>
  {/if}
</div>

{#if isOpen}
  <!-- Backdrop to close dropdown -->
  <button
    type="button"
    class="fixed inset-0 z-40"
    onclick={() => isOpen = false}
    aria-label="Close dropdown"
  ></button>
{/if}
