<script lang="ts">
  import AgentMessage from './AgentMessage.svelte';
  import HumanInput from './HumanInput.svelte';
  import type { PlanningState } from '$lib/types';

  interface Props {
    state: PlanningState;
    modelAName: string;
    modelBName: string;
    onstop: () => void;
    onintervene: (input: string) => void;
    onreset: () => void;
  }

  let { state, modelAName, modelBName, onstop, onintervene, onreset }: Props = $props();

  let messagesContainer: HTMLDivElement;

  // Auto-scroll to bottom when new messages arrive
  $effect(() => {
    if (state.messages.length && messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  const statusText = $derived({
    idle: 'Ready to plan',
    configuring: 'Configure your planning session',
    planning: 'Planning in progress...',
    agreed: 'Plan agreed!',
    stopped: 'Planning stopped',
    error: state.error || 'An error occurred'
  }[state.status]);

  const canIntervene = $derived(state.status === 'planning' || state.status === 'stopped');
</script>

<div class="flex flex-col h-full">
  <!-- Header -->
  <div class="border-b-2 border-black p-4 bg-white">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-mono font-bold text-lg">{statusText}</h2>
        <p class="text-sm text-gray-600 font-mono mt-1">
          Round {state.rounds} · {state.messages.length} messages
        </p>
      </div>

      <div class="flex gap-2">
        {#if state.status === 'planning'}
          <button
            onclick={onstop}
            class="px-4 py-2 bg-red-500 text-white border-2 border-black font-mono font-bold uppercase text-sm
                   hover:bg-red-400 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]
                   transition-all"
          >
            Stop
          </button>
        {:else if state.status === 'agreed' || state.status === 'stopped' || state.status === 'error'}
          <button
            onclick={onreset}
            class="px-4 py-2 bg-gray-200 border-2 border-black font-mono font-bold uppercase text-sm
                   hover:bg-gray-300 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]
                   transition-all"
          >
            New Plan
          </button>
        {/if}
      </div>
    </div>

    <!-- Agreement status -->
    {#if state.status === 'planning' || state.status === 'agreed'}
      <div class="flex gap-4 mt-3 text-sm font-mono">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full {state.agentAAgreed ? 'bg-green-500' : 'bg-gray-300'}"></div>
          <span class="text-gray-600">{modelAName}: {state.agentAAgreed ? 'Agreed' : 'Pending'}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full {state.agentBAgreed ? 'bg-green-500' : 'bg-gray-300'}"></div>
          <span class="text-gray-600">{modelBName}: {state.agentBAgreed ? 'Agreed' : 'Pending'}</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Messages -->
  <div
    bind:this={messagesContainer}
    class="flex-1 overflow-y-auto p-4 bg-gray-50 chat-scroll"
  >
    {#if state.messages.length === 0}
      <div class="flex items-center justify-center h-full text-gray-400 font-mono">
        <p>Waiting for agents to start planning...</p>
      </div>
    {:else}
      {#each state.messages as message (message.id)}
        <AgentMessage
          {message}
          {modelAName}
          {modelBName}
        />
      {/each}
    {/if}

    {#if state.status === 'agreed' && state.currentPlan}
      <div class="mt-6 p-6 bg-green-50 border-2 border-green-500 rounded-lg">
        <h3 class="font-mono font-bold text-green-800 mb-4 flex items-center gap-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Final Agreed Plan
        </h3>
        <div class="bg-white border-2 border-black p-4 font-mono text-sm whitespace-pre-wrap">
          {state.currentPlan}
        </div>
      </div>
    {/if}
  </div>

  <!-- Human intervention input -->
  {#if canIntervene}
    <HumanInput
      onsubmit={onintervene}
      disabled={false}
      placeholder="Steer the conversation - add context, ask for changes, or guide the direction..."
    />
  {/if}
</div>
