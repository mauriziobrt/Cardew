<script>
  // value: 'left' | 'both' | 'right'
  export let value = "both";

  // Optional: customize labels/tooltips per state
  export let labels = {
    left: "Left only",
    both: "Both directions",
    right: "Right only"
  };

  const states = ["left", "both", "right"];
  const icons = { left: "←", both: "↔", right: "→" };

  function cycle() {
    const idx = states.indexOf(value);
    value = states[(idx + 1) % states.length];
  }

  function setState(s) {
    value = s;
  }

  function handleKeydown(e) {
    if (e.key === "ArrowLeft") {
      const idx = states.indexOf(value);
      value = states[Math.max(0, idx - 1)];
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      const idx = states.indexOf(value);
      value = states[Math.min(states.length - 1, idx + 1)];
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === " ") {
      cycle();
      e.preventDefault();
    }
  }
</script>

<!--
  Usage:
  <TriStateToggle bind:value={mySetting} />

  Click the switch to cycle: left -> both -> right -> left ...
  Or click a segment directly to jump to that state.
  Arrow keys also work when focused.
-->

<div
  class="tri-toggle"
  data-state={value}
  role="radiogroup"
  aria-label="three state toggle"
  tabindex="0"
  on:keydown={handleKeydown}
>
  <div class="tri-toggle-track">
    <div class="tri-toggle-thumb"></div>

    {#each states as s}
      <button
        type="button"
        class="tri-toggle-segment"
        class:active={value === s}
        role="radio"
        aria-checked={value === s}
        title={labels[s]}
        on:click={() => setState(s)}
      >
        {icons[s]}
      </button>
    {/each}
  </div>
</div>

<style>
  .tri-toggle {
    display: inline-flex;
    outline: none;
  }

  .tri-toggle-track {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    width: 108px;
    height: 32px;
    padding: 3px;
    border-radius: 999px;
    background: var(--background-modifier-border);
    box-sizing: border-box;
  }

  .tri-toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: calc((100% - 6px) / 3);
    height: calc(100% - 6px);
    border-radius: 999px;
    background: var(--interactive-accent);
    transition: transform 0.18s ease;
    z-index: 0;
  }

  /* Slide the thumb based on the current state */
  .tri-toggle[data-state="left"] .tri-toggle-thumb {
    transform: translateX(0%);
  }
  .tri-toggle[data-state="both"] .tri-toggle-thumb {
    transform: translateX(100%);
  }
  .tri-toggle[data-state="right"] .tri-toggle-thumb {
    transform: translateX(200%);
  }

  .tri-toggle-segment {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    box-shadow: none;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    color: var(--text-muted);
    transition: color 0.18s ease;
    padding: 0;
    margin: 0;
  }

  .tri-toggle-segment.active {
    color: var(--text-on-accent);
  }

  .tri-toggle-segment:hover:not(.active) {
    color: var(--text-normal);
  }

  .tri-toggle:focus-visible {
    box-shadow: 0 0 0 2px var(--interactive-accent);
    border-radius: 999px;
  }
</style>
