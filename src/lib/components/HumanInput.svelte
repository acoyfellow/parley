<script lang="ts">
  interface Props {
    onsubmit: (input: string) => void;
    disabled?: boolean;
    placeholder?: string;
  }

  let { onsubmit, disabled = false, placeholder = 'Intervene in the planning...' }: Props = $props();

  let input = $state('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onsubmit(input.trim());
      input = '';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }
</script>

<form onsubmit={handleSubmit} class="border-t-2 border-black bg-white p-4">
  <div class="flex gap-3">
    <textarea
      bind:value={input}
      onkeydown={handleKeydown}
      {placeholder}
      {disabled}
      rows="2"
      class="flex-1 px-4 py-3 border-2 border-black font-mono text-sm
             resize-none focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed"
    ></textarea>
    <button
      type="submit"
      disabled={disabled || !input.trim()}
      class="px-6 py-3 bg-yellow-400 border-2 border-black font-mono font-bold uppercase
             hover:bg-yellow-300 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]
             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
             transition-all"
    >
      Send
    </button>
  </div>
  <p class="mt-2 text-xs text-gray-500 font-mono">
    Press Enter to send, Shift+Enter for new line
  </p>
</form>
