<script lang="ts">
  import type { PlanningMessage, ToolType } from '$lib/types';

  interface Props {
    message: PlanningMessage;
    modelAName?: string;
    modelBName?: string;
  }

  let { message, modelAName = 'Agent A', modelBName = 'Agent B' }: Props = $props();

  const roleStyles = $derived({
    'agent-a': {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      label: modelAName,
      labelBg: 'bg-blue-500'
    },
    'agent-b': {
      bg: 'bg-green-50',
      border: 'border-green-500',
      label: modelBName,
      labelBg: 'bg-green-500'
    },
    'human': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      label: 'You',
      labelBg: 'bg-yellow-500'
    },
    'system': {
      bg: 'bg-gray-50',
      border: 'border-gray-500',
      label: 'System',
      labelBg: 'bg-gray-500'
    }
  });

  const style = $derived(roleStyles[message.role] || roleStyles.system);

  const toolLabels: Record<ToolType, string> = {
    think: 'Thinking',
    propose_plan: 'Plan',
    critique: 'Critique',
    ask_question: 'Question',
    agree: 'Agreed',
    respond: 'Response'
  };

  // Parse the message content to extract thinking and tool content
  interface ParsedContent {
    thinking: string | null;
    toolType: ToolType | null;
    toolContent: string | null;
  }

  function parseContent(content: string): ParsedContent {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    const thinking = thinkMatch ? thinkMatch[1].trim() : null;

    const tools: ToolType[] = ['propose_plan', 'critique', 'ask_question', 'agree', 'respond'];
    let toolType: ToolType | null = null;
    let toolContent: string | null = null;

    for (const tool of tools) {
      const regex = new RegExp(`<${tool}>([\\s\\S]*?)<\\/${tool}>`);
      const match = content.match(regex);
      if (match) {
        toolType = tool;
        toolContent = match[1].trim();
        break;
      }
    }

    // If no tool found, use raw content
    if (!toolType && !thinking) {
      toolContent = content;
    }

    return { thinking, toolType, toolContent };
  }

  const parsed = $derived(parseContent(message.content));

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="mb-4">
  <div class="{style.bg} border-l-4 {style.border} p-4 rounded-r-lg">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <span class="{style.labelBg} text-white text-xs font-mono px-2 py-1 rounded">
          {style.label}
        </span>
        {#if message.tool}
          <span class="bg-gray-200 text-gray-700 text-xs font-mono px-2 py-1 rounded">
            {toolLabels[message.tool]}
          </span>
        {/if}
        {#if message.isStreaming}
          <span class="flex items-center gap-1 text-xs text-gray-500">
            <span class="typing-dot w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
            <span class="typing-dot w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
            <span class="typing-dot w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
          </span>
        {/if}
      </div>
      <span class="text-xs text-gray-400 font-mono">
        {formatTime(message.timestamp)}
      </span>
    </div>

    <!-- Thinking section -->
    {#if parsed.thinking}
      <details class="mb-3" open={message.isStreaming}>
        <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700 font-mono">
          Thinking...
        </summary>
        <div class="mt-2 pl-4 border-l-2 border-gray-200 text-sm text-gray-600 italic whitespace-pre-wrap">
          {parsed.thinking}
        </div>
      </details>
    {/if}

    <!-- Tool content -->
    {#if parsed.toolContent}
      <div class="prose prose-sm max-w-none">
        {#if parsed.toolType === 'propose_plan'}
          <div class="bg-white border-2 border-black p-4 rounded font-mono text-sm whitespace-pre-wrap">
            {parsed.toolContent}
          </div>
        {:else if parsed.toolType === 'agree'}
          <div class="flex items-center gap-2 text-green-700 font-semibold">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {parsed.toolContent}
          </div>
        {:else if parsed.toolType === 'critique'}
          <div class="bg-orange-50 border border-orange-200 p-3 rounded text-sm whitespace-pre-wrap">
            {parsed.toolContent}
          </div>
        {:else if parsed.toolType === 'ask_question'}
          <div class="bg-purple-50 border border-purple-200 p-3 rounded text-sm">
            <strong>Question:</strong> {parsed.toolContent}
          </div>
        {:else}
          <div class="text-sm whitespace-pre-wrap">
            {parsed.toolContent}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
