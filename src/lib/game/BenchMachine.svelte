<script lang="ts">
  export let missionId: string;
  export let outputs: Record<string, boolean> | null;
  export let inputs: Record<string, boolean>;
  export let certified = false;

  $: active = outputs ? Object.values(outputs).some(Boolean) : false;
  $: signalColor = active ? '#a7e2ad' : '#546c65';
</script>

<div class="bench-machine" aria-hidden="true">
  <svg viewBox="0 0 280 165">
    <ellipse
      cx="140"
      cy="106"
      rx="100"
      ry="40"
      fill="none"
      stroke="#51776b"
      stroke-dasharray="2 8"
      opacity=".2"
    />
    <ellipse cx="140" cy="106" rx="75" ry="26" fill="none" stroke="#51776b" opacity=".16" />
    <path
      d="M 48 114 l 12 -2 m 157 -24 l 12 -2 M 65 65 h 7 m -3 -3 v 6 M 220 126 h 7 m -3 -3 v 6"
      stroke="#a5bca0"
      opacity=".45"
    />
    {#if missionId === 'and'}
      <path
        d="M 49 102 l 42 -16 39 17 -42 18 Z M 157 102 l 41 -16 39 17 -42 18 Z"
        fill="#4f6c50"
        stroke="#718363"
      />
      <path
        d="M 49 102 v 14 l 39 18 v -13 M 157 102 v 14 l 38 18 v -13"
        fill="#334d46"
        stroke="#405b4d"
      />
      <path d="M 88 95 l 107 -1" stroke="#ad7756" stroke-width="9" stroke-linecap="round" />
      <path d="M 88 100 l 107 0" stroke="#dec69b" stroke-width="3" stroke-dasharray="4 2" />
      <g class:bridge-open={active} class="bridge-deck">
        <path d="M 92 104 l 72 0" stroke="#e29b6c" stroke-width="12" />
        <path d="M 92 104 l 72 0" stroke="#f6d6a6" stroke-width="1" stroke-dasharray="5 5" />
      </g>
      <path d="M 80 88 v 22 M 189 87 v 23" stroke="#d6a271" stroke-width="5" />
      <circle cx="80" cy="83" r="5" fill={signalColor} /><circle
        cx="189"
        cy="82"
        r="5"
        fill={signalColor}
      />
      <path d="M 128 126 l 15 -4 11 4 -11 5 Z" fill="#bd8b63" /><path
        d="M 140 123 v -10 l 8 7 Z"
        fill="#e3c79a"
      />
    {:else if missionId === 'or'}
      <path d="M 78 106 l 64 -25 72 25 -65 28 Z" fill="#4e6d4e" stroke="#69835d" /><path
        d="M 78 106 v 13 l 71 28 v -13 l 65 -28 v 13 l -65 28"
        fill="#2b4841"
      />
      <path d="M 100 70 l 47 -16 44 18 v 42 l -44 17 -47 -18 Z" fill="#bc815d" /><path
        d="M 147 54 l 44 18 v 42 l -44 17 Z"
        fill="#845e4e"
      />
      <path d="M 93 70 l 47 -24 59 22 -51 22 Z" fill="#e4ac74" stroke="#f0c694" /><path
        d="M 148 90 l 51 -22 v 7 l -51 22 -55 -20 v -7 Z"
        fill="#aa734c"
      />
      <path
        d="M 108 83 l 12 5 v 16 l -12 -5 Z M 128 91 l 11 4 v 16 l -11 -5 Z M 159 94 l 12 -5 v 16 l -12 5 Z M 177 87 l 8 -4 v 16 l -8 4 Z"
        fill={signalColor}
      />
      <path d="M 162 62 v -24 l 12 -5 8 4 v 27" fill="#a97353" /><path
        d="M 162 38 l 12 -5 8 4 -12 4 Z"
        fill="#e0b07d"
      />
      {#if active}<path
          d="M 172 27 q -12 -9 0 -18 M 184 20 q -10 -8 0 -15"
          stroke="#a2c7b6"
          fill="none"
          stroke-width="3"
          opacity=".5"
        />{/if}
    {:else if missionId === 'xor'}
      <path d="M 92 116 l 52 -20 49 18 -50 24 Z" fill="#4b674d" stroke="#6b7c5a" /><path
        d="M 92 116 v 12 l 51 23 v -13 l 50 -24 v 12 l -50 25"
        fill="#2c4941"
      />
      <path
        d="M 126 114 l 16 -71 18 70 M 133 85 h 20 M 129 102 h 28 M 139 57 h 7"
        stroke="#c28f64"
        fill="none"
        stroke-width="5"
      />
      <circle cx="142" cy="38" r="13" fill="#bd865f" /><circle
        cx="142"
        cy="38"
        r="7"
        fill={signalColor}
      />
      <path
        d="M 121 34 q -9 7 0 14 M 163 34 q 9 7 0 14 M 111 25 q -18 16 0 32 M 173 25 q 18 16 0 32"
        fill="none"
        stroke={active ? '#9cdbb3' : '#40594e'}
        stroke-width="2"
      />
      <path d="M 160 115 l 20 -7 0 15 -20 9 Z" fill="#dfad79" /><path
        d="M 163 116 l 13 -5 v 8 l -13 5 Z"
        fill={signalColor}
      />
    {:else if missionId === 'mux' || missionId === 'dmux'}
      <path d="M 73 112 l 70 -29 70 28 -71 30 Z" fill="#4f6c50" stroke="#728568" /><path
        d="M 73 112 v 12 l 69 29 v -12 l 71 -30 v 12 l -71 30"
        fill="#2f4941"
      />
      <path
        d="M 141 111 v -35 M 141 97 l -42 -15 M 141 97 l 43 -15"
        stroke="#b18760"
        fill="none"
        stroke-width="4"
      />
      <path
        d={inputs.sel ? 'M 141 111 V 97 L 184 82' : 'M 141 111 V 97 L 99 82'}
        stroke="#a9d4a2"
        fill="none"
        stroke-width="3"
      />
      <path
        d="M 84 72 l 15 -6 15 6 v 18 l -15 6 -15 -6 Z M 169 72 l 15 -6 15 6 v 18 l -15 6 -15 -6 Z M 126 107 l 15 -6 15 6 v 18 l -15 6 -15 -6 Z"
        fill="#ad7a58"
        stroke="#dfae7c"
      />
      <circle
        cx="99"
        cy="79"
        r="5"
        fill={missionId === 'dmux'
          ? outputs?.a
            ? '#a7e2ad'
            : '#546c65'
          : inputs.a
            ? '#a7e2ad'
            : '#546c65'}
      /><circle
        cx="184"
        cy="79"
        r="5"
        fill={missionId === 'dmux'
          ? outputs?.b
            ? '#a7e2ad'
            : '#546c65'
          : inputs.b
            ? '#a7e2ad'
            : '#546c65'}
      /><circle cx="141" cy="114" r="5" fill={signalColor} />
      <text x="99" y="58" text-anchor="middle">a</text><text x="184" y="58" text-anchor="middle"
        >b</text
      ><text x="141" y="146" text-anchor="middle">{missionId === 'dmux' ? 'in' : 'out'}</text>
    {:else}
      <path d="M 87 112 l 55 -21 53 20 -53 24 Z" fill="#4d6b4e" stroke="#738568" /><path
        d="M 87 112 v 12 l 55 24 v -13 l 53 -24 v 12 l -53 25"
        fill="#2c4740"
      />
      <path d="M 120 59 l 25 -8 24 10 v 55 l -24 10 -25 -11 Z" fill="#ba7d59" /><path
        d="M 145 51 l 24 10 v 55 l -24 10 Z"
        fill="#835a49"
      />
      <path d="M 111 57 l 29 -12 38 13 -32 13 Z" fill="#dfaa73" stroke="#efc795" /><path
        d="M 111 57 v 6 l 35 13 32 -12 v -6 l -32 13 Z"
        fill="#a16d47"
      />
      <path d="M 145 44 v -21" stroke="#c09b71" stroke-width="2" /><circle
        cx="145"
        cy="38"
        r="9"
        fill={signalColor}
        stroke="#c3b38c"
        stroke-width="3"
      />
      {#if active}<circle cx="145" cy="38" r="18" fill="#b0e8ba" opacity=".1" /><circle
          cx="145"
          cy="38"
          r="26"
          fill="none"
          stroke="#a0dbb4"
          opacity=".2"
        />{/if}
      <path d="M 125 77 l 10 4 v 16 l -10 -4 Z" fill={signalColor} /><path
        d="M 146 105 l 10 -4 v 20 l -10 4 Z"
        fill="#594537"
      />
    {/if}
  </svg>
  <div class="machine-reading">
    {certified
      ? 'ALL SIGNALS VERIFIED'
      : outputs
        ? `LIVE · ${Object.entries(outputs)
            .map(([pin, value]) => `${pin}=${Number(value)}`)
            .join(' / ')}`
        : 'AWAITING A COMPLETE CIRCUIT'}
  </div>
</div>

<style>
  .bench-machine {
    margin: 0 -14px;
    min-height: 170px;
  }
  .bench-machine svg {
    display: block;
    width: 100%;
    height: 165px;
  }
  .bench-machine text {
    fill: #a5b89c;
    font: 10px monospace;
    letter-spacing: 1px;
  }
  .machine-reading {
    font: 8px/1.5 monospace;
    letter-spacing: 1.3px;
    color: #8eb09d;
    text-align: center;
    min-height: 15px;
  }
  .bridge-deck {
    transform: rotate(-45deg);
    transform-origin: 92px 104px;
    transition: transform 0.35s;
  }
  .bridge-deck.bridge-open {
    transform: rotate(0deg);
  }
  @media (prefers-reduced-motion: reduce) {
    .bridge-deck {
      transition: none;
    }
  }
  @media (max-width: 550px) {
    .bench-machine {
      margin: -7px -18px -6px;
      min-height: 140px;
    }
    .bench-machine svg {
      height: 120px;
    }
    .machine-reading {
      font-size: 6px;
      letter-spacing: 0.5px;
    }
  }
</style>
