<script lang="ts">
  export let progress = 0;
  export let instance = 'computer-journey';

  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const between = (value: number, start: number, end: number) =>
    clamp((value - start) / (end - start));
  const ease = (value: number) => value * value * (3 - 2 * value);
  const descriptions = [
    'A complete laptop computer, with its screen, keyboard and case assembled.',
    'The same computer taken apart: screen, keyboard, mainboard, memory and processor.',
    'The camera moves into the processor, revealing the silicon and its connected circuits.',
    'Inside the circuitry, a signal has two states: off, zero, and on, one.',
  ];
  $: split = ease(between(progress, 0.02, 1));
  $: approach = ease(between(progress, 1.08, 2));
  $: dissolve = ease(between(progress, 2.12, 2.94));
  $: magnification = (1 + approach * 3.65) * (1 - 0.16 * split * (1 - approach));
  $: focalX = 358 + approach * 19;
  $: focalY = 324 + approach * 28;
  $: labelOpacity = ease(between(progress, 0.6, 0.9)) * (1 - ease(between(progress, 1.1, 1.4)));
  $: phase = Math.min(3, Math.max(0, Math.round(progress)));
</script>

<svg
  class="computer-cutaway"
  viewBox="0 0 740 690"
  fill="none"
  role="img"
  aria-label={descriptions[phase]}
  data-scene={phase}
>
  <defs>
    <linearGradient
      id={`${instance}-body`}
      x1="150"
      y1="100"
      x2="570"
      y2="500"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#54596f" />
      <stop offset=".48" stop-color="#23283e" />
      <stop offset="1" stop-color="#111625" />
    </linearGradient>
    <linearGradient
      id={`${instance}-screen`}
      x1="190"
      y1="90"
      x2="590"
      y2="310"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#f1efff" />
      <stop offset="1" stop-color="#b4b2d5" />
    </linearGradient>
    <linearGradient
      id={`${instance}-board`}
      x1="20"
      y1="14"
      x2="400"
      y2="124"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#302e57" />
      <stop offset="1" stop-color="#13172b" />
    </linearGradient>
    <linearGradient
      id={`${instance}-chip`}
      x1="168"
      y1="27"
      x2="250"
      y2="103"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#53516c" />
      <stop offset=".25" stop-color="#222438" />
      <stop offset="1" stop-color="#0c1020" />
    </linearGradient>
    <radialGradient id={`${instance}-light`}>
      <stop stop-color="#6960df" stop-opacity=".23" />
      <stop offset="1" stop-color="#6960df" stop-opacity="0" />
    </radialGradient>
    <filter id={`${instance}-glow`} x="-150%" y="-150%" width="400%" height="400%">
      <feGaussianBlur stdDeviation="7" />
    </filter>
  </defs>

  <ellipse
    cx="385"
    cy="372"
    rx="340"
    ry="310"
    fill={`url(#${instance}-light)`}
    opacity={0.55 + split * 0.45}
  />
  <g
    opacity={1 - dissolve}
    transform={`translate(358 324) scale(${magnification}) translate(${-focalX} ${-focalY})`}
  >
    <ellipse cx="355" cy="535" rx="252" ry="47" fill="#02030a" opacity={0.5 * (1 - approach)} />

    <!-- A common perspective is preserved as the real components separate. -->
    <g class="assembly-lines" opacity={split * (1 - approach)}>
      <path d={`M185 340 185 ${340 + split * 150}M610 400 610 ${400 + split * 150}`} />
      <path
        d={`M209 370 ${209 + 38 * split} ${370 - 80 * split}M338 431 ${338 + 38 * split} ${431 - 80 * split}`}
      />
      <path d={`M185 340 ${185 - 44 * split} ${340 - 138 * split}`} />
    </g>

    <g transform={`translate(${-45 * split} ${88 * split})`} opacity={1 - approach * 0.9}>
      <path
        d="M65 475 490 535 610 400 610 414 491 551 65 491Z"
        fill="#171c2c"
        stroke="#6f7897"
        stroke-width="1.4"
      />
      <path
        d="M185 340 610 400 490 535 65 475Z"
        fill={`url(#${instance}-body)`}
        stroke="#929bb5"
        stroke-width="1.5"
      />
      <path d="M65 480 490 541 610 405" stroke="#59637f" />
      <path d="m90 485 40 6m14 2 23 3m317 48 20-22" stroke="#030715" stroke-width="3" />
    </g>

    <g transform="matrix(1 .142 -.85 .95 185 340)" opacity={1 - approach * 0.6}>
      <rect
        x="20"
        y="14"
        width="380"
        height="110"
        rx="5"
        fill={`url(#${instance}-board)`}
        stroke="#8782b0"
        stroke-width="1.2"
      />
      <g class="board-traces">
        <path
          d="M36 27H130L151 48H165M36 34H123L145 56H165M36 41H116L138 64H165M36 48H109L131 72H165M36 55H102L124 80H165"
        />
        <path
          d="M250 40H269L281 28H300M250 48H277L289 36H300M250 56H285L297 44H316M250 64H293L305 52H316"
        />
        <path d="M184 103V111H53V82M192 103V117H46V79M226 103V113H350V71M234 103V119H357V71" />
        <path d="M145 17V26L161 42M260 119V99L277 82H378" />
      </g>
      {#each [0, 1, 2, 3] as row}
        <rect
          x="48"
          y={26 + row * 17}
          width="42"
          height="11"
          rx="1.5"
          fill="#0a0e1d"
          stroke="#5d6482"
        />
        <path
          d={`M52 ${25 + row * 17}v-3m8 3v-3m8 3v-3m8 3v-3m8 3v-3`}
          stroke="#a6a0c1"
          stroke-width="2"
        />
      {/each}
      <rect x="316" y="64" width="59" height="35" rx="2" fill="#0a0e1d" stroke="#6f7390" />
      <path d="M326 73h39m-39 8h29m-29 8h35" stroke="#626b88" stroke-width="2" />
      {#each [[31, 22], [387, 22], [31, 115], [387, 115]] as [x, y]}
        <circle cx={x} cy={y} r="3" fill="#0a0d19" stroke="#9690b9" />
      {/each}
    </g>

    <g transform={`translate(${92 * split} ${30 * split})`} opacity={1 - approach}>
      <g transform="matrix(1 .142 -.85 .95 185 340)">
        <rect x="285" y="25" width="95" height="31" rx="2" fill="#322e54" stroke="#aaa0d6" />
        {#each [0, 1, 2, 3] as index}
          <rect
            x={291 + index * 22}
            y="30"
            width="17"
            height="17"
            rx="1"
            fill="#131726"
            stroke="#74708e"
            stroke-width=".6"
          />
        {/each}
        {#each Array.from({ length: 18 }) as _, index}
          <path d={`M${290 + index * 4.8} 51v6`} stroke="#c2ad88" stroke-width="2.5" />
        {/each}
      </g>
    </g>

    <g class="processor" transform={`translate(${38 * split} ${-80 * split})`}>
      <g transform="matrix(1 .142 -.85 .95 185 340)">
        <rect x="162" y="23" width="94" height="84" rx="3" fill="#28273e" stroke="#9d92c9" />
        {#each Array.from({ length: 12 }) as _, index}
          <path
            d={`M${175 + index * 6.1} 21v-8m0 96v8M160 ${31 + index * 6.1}h-8m106 0h8`}
            stroke="#c9bfd9"
            stroke-width="2.5"
          />
        {/each}
        <rect
          x="168"
          y="27"
          width="82"
          height="76"
          rx="2"
          fill={`url(#${instance}-chip)`}
          stroke="#c5b8ed"
          stroke-width=".8"
        />
        <path d="M173 32H245V98H173Z" stroke="#827898" stroke-width=".6" />
        <rect
          x="184"
          y="44"
          width="50"
          height="41"
          fill="#7472a8"
          stroke="#dbd4f6"
          stroke-width=".6"
        />
        <g stroke="#d6cfff" stroke-width=".45" opacity=".88">
          {#each Array.from({ length: 7 }) as _, index}
            <path d={`M${188 + index * 6.3} 47v35M187 ${49 + index * 4.5}h44`} />
          {/each}
        </g>
        <path
          d="M190 54H201V65H218V76H229M190 76H202V60H228M211 47V55H224V70"
          stroke="#f0eaff"
          stroke-width="1.2"
        />
        <circle cx="174" cy="96" r="1.4" fill="#d4c3ff" />
      </g>
    </g>

    <!-- The keyboard is a separate deck, exposing the circuit board below it. -->
    <g transform={`translate(${-110 * split} ${150 * split})`} opacity={1 - approach}>
      <path
        d="M185 340 610 400 490 535 65 475Z"
        fill="#252b41"
        stroke="#b0b7cc"
        stroke-width="1.2"
      />
      <path d="M185 345 603 403 487 530 71 473" stroke="#5d6784" />
      <g transform="matrix(1 .142 -.85 .95 190 350)">
        <rect x="8" y="5" width="386" height="72" rx="4" fill="#111625" stroke="#6a7493" />
        {#each Array.from({ length: 5 }) as _, row}
          {#each Array.from({ length: 13 }) as _, column}
            <rect
              x={15 + column * 28.8}
              y={11 + row * 12.4}
              width="23"
              height="8.7"
              rx="1.4"
              fill="#353c55"
              stroke="#8790aa"
              stroke-width=".5"
            />
          {/each}
        {/each}
        <rect
          x="125"
          y="83"
          width="135"
          height="38"
          rx="3"
          fill="#2d344b"
          stroke="#7a85a2"
          stroke-width=".8"
        />
        <path d="M136 104h113" stroke="#7a85a2" stroke-opacity=".4" />
      </g>
    </g>

    <g
      transform={`translate(${-44 * split} ${-138 * split}) rotate(${-8 * split} 390 230)`}
      opacity={1 - approach}
    >
      <g transform="matrix(1 .142 0 1 0 0)">
        <rect
          x="185"
          y="74"
          width="425"
          height="240"
          rx="12"
          fill={`url(#${instance}-body)`}
          stroke="#a0a8c0"
          stroke-width="1.6"
        />
        <rect x="200" y="89" width="395" height="206" rx="4" fill={`url(#${instance}-screen)`} />
        <circle cx="397" cy="81" r="2" fill="#0a0d16" stroke="#737b94" />
        <g fill="#282549">
          <rect x="219" y="109" width="112" height="5" rx="2.5" opacity=".5" />
          <rect x="219" y="120" width="74" height="3" rx="1.5" opacity=".25" />
          <text x="218" y="177" class="screen-title">Hello, world.</text>
          <text x="219" y="198" class="screen-caption">const message = "Hello, world.";</text>
          <text x="219" y="212" class="screen-caption">console.log(message);</text>
        </g>
        <rect x="218" y="236" width="352" height="36" rx="3" fill="#faf9ff" fill-opacity=".65" />
        <path d="m233 248 6 5-6 5m15 1h8" stroke="#4d428d" stroke-width="1.6" />
        <path d="M270 248h97m-97 8h61" stroke="#68617f" stroke-width="2.4" stroke-linecap="round" />
        <g transform="translate(500 162)" stroke="#5a4cb6" stroke-width="1.2">
          <rect x="-18" y="-18" width="51" height="51" rx="6" fill="#7465e2" fill-opacity=".1" />
          <path d="m2-10-9 7 9 7m13-14 9 7-9 7M6 15 12-14" />
        </g>
        <path d="M198 309H597" stroke="#858ca7" stroke-width="3" stroke-linecap="round" />
      </g>
    </g>
  </g>

  <g
    class="component-labels"
    opacity={labelOpacity}
    transform={`translate(358 324) scale(${magnification}) translate(${-focalX} ${-focalY})`}
    aria-hidden="true"
  >
    <path
      fill="none"
      d="M86 78h50l45 40M598 497h-55l-25-22M510 304h-52l-45 26M655 432h-35l-20-27M96 637h53l27-27"
    />
    <text x="86" y="66">DISPLAY</text>
    <text x="546" y="518">MAINBOARD</text>
    <text x="463" y="291">PROCESSOR</text>
    <text x="615" y="453">MEMORY</text>
    <text x="96" y="659">KEYBOARD</text>
  </g>

  <!-- Zooming through the die reveals the same repeated pattern at signal scale. -->
  <g
    opacity={dissolve}
    transform={`translate(370 343) scale(${0.66 + dissolve * 0.34}) translate(-370 -343)`}
  >
    <g class="micro-circuit" opacity=".55">
      <path
        d="M71 170h150l34 34h127l47-47h214M71 188h137l35 35h149l47-47h204M79 474h147l33-33h116l40 40h229M79 492h156l33-33h97l40 40h239"
      />
      <path d="M153 95v66m27-66v66m334-66v64m28-64v64M196 519v67m28-67v67m283-67v67m28-67v67" />
      <path
        d="M80 269h53v40h72M80 286h36v40h89M568 294h37v-37h52M568 312h54v-37h35M280 115v51h62M298 115v33h44M392 526h58v57M392 544h40v39"
      />
      {#each [[221, 170], [382, 204], [429, 157], [226, 474], [375, 441], [415, 481], [133, 269], [605, 257]] as [x, y]}
        <circle cx={x} cy={y} r="4" fill="#0a0c16" stroke="#8f85c2" stroke-width="1.3" />
      {/each}
      <path
        d="M309 81h80v43h-80zM121 586h137v25H121zM496 583h93v28h-93zM27 324h50v91H27zM658 318h48v107h-48z"
      />
    </g>
    <rect x="91" y="233" width="560" height="205" rx="5" fill="#080b15" fill-opacity=".86" />
    <path d="M112 404H241V263H453V404H626" stroke="#77708f" stroke-width="3" />
    <path d="M241 404V263H453V404" stroke="#b4a3ff" stroke-width="4" />
    <circle
      cx="241"
      cy="263"
      r="9"
      fill="#bbaaff"
      opacity=".65"
      filter={`url(#${instance}-glow)`}
    />
    <circle
      cx="453"
      cy="404"
      r="9"
      fill="#bbaaff"
      opacity=".65"
      filter={`url(#${instance}-glow)`}
    />
    <circle cx="241" cy="263" r="4" fill="#e7dfff" />
    <circle cx="453" cy="404" r="4" fill="#e7dfff" />
    <text x="160" y="370" class="state-number">0</text>
    <text x="330" y="231" class="state-number high-state">1</text>
    <text x="539" y="370" class="state-number">0</text>
    <text x="166" y="429" class="state-label">OFF</text>
    <text x="341" y="294" class="state-label high-state">ON</text>
    <text x="545" y="429" class="state-label">OFF</text>
  </g>
</svg>

<style>
  .computer-cutaway {
    display: block;
    width: 100%;
    height: auto;
    overflow: hidden;
  }
  .assembly-lines {
    stroke: #777192;
    stroke-width: 1;
    stroke-dasharray: 3 6;
  }
  .board-traces {
    stroke: #8b82b0;
    stroke-width: 0.8;
  }
  .screen-title {
    font:
      500 30px/1 system-ui,
      sans-serif;
    letter-spacing: -1.1px;
  }
  .screen-caption {
    font:
      11px system-ui,
      sans-serif;
  }
  .component-labels {
    fill: #c0bbd4;
    font:
      12px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 1.1px;
  }
  .component-labels path {
    fill: none;
    stroke: #777089;
    stroke-width: 1;
  }
  .micro-circuit {
    stroke: #8a80b5;
    stroke-width: 1.3;
  }
  .state-number {
    fill: #c3c1d4;
    font:
      400 56px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .state-label {
    fill: #c3c1d4;
    font:
      11px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 2px;
  }
  .high-state {
    fill: #d6c8ff;
  }
</style>
