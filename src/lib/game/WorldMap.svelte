<script lang="ts">
  type Station = { id: string; name: string; title: string; x: number; y: number; number: string };
  let { completed = [], selected = 'nand', onselect }: {
    completed?: string[];
    selected?: string;
    onselect: (id: string) => void;
  } = $props();

  const stations: Station[] = [
    { id: 'nand', name: 'NAND', title: 'The spark', x: 178, y: 500, number: '01' },
    { id: 'not', name: 'NOT', title: 'Flip the signal', x: 354, y: 340, number: '02' },
    { id: 'and', name: 'AND', title: 'Better together', x: 536, y: 510, number: '03' },
    { id: 'or', name: 'OR', title: 'Another way', x: 716, y: 355, number: '04' },
    { id: 'xor', name: 'XOR', title: 'One or the other', x: 1002, y: 505, number: '05' },
    { id: 'mux', name: 'Mux', title: 'Choose a path', x: 988, y: 210, number: '06' },
    { id: 'dmux', name: 'DMux', title: 'Send it onward', x: 675, y: 145, number: '07' }
  ];
  const routes = [
    'M178 510C178 402 354 444 354 350',
    'M354 350C354 472 536 403 536 520',
    'M536 520C536 393 716 474 716 365',
    'M716 365C716 497 1002 399 1002 515',
    'M1002 515C1122 485 1104 263 988 220',
    'M988 220C920 279 848 145 675 155'
  ];
</script>

<div class="world-shell">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to pan the scrollable map.) -->
  <div class="map-scroll" tabindex="0" role="region" aria-label="Signal Isles world map. Select a station to open its mission.">
    <div class="map-canvas">
      <svg class="world-art" viewBox="0 0 1200 720" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="isles-sea"><stop stop-color="#203e48"/><stop offset="1" stop-color="#10212d"/></radialGradient>
          <linearGradient id="isles-land" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b7ccad"/><stop offset="1" stop-color="#819d91"/></linearGradient>
          <linearGradient id="isles-chip" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#425d63"/><stop offset="1" stop-color="#1c333f"/></linearGradient>
          <linearGradient id="isles-light" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f6deb0"/><stop offset="1" stop-color="#d9b887"/></linearGradient>
          <pattern id="isles-grid" width="48" height="28" patternUnits="userSpaceOnUse"><path d="M24 0L48 14 24 28 0 14Z" stroke="#88c3c2" stroke-opacity=".035"/></pattern>
          <pattern id="isles-dots" width="38" height="38" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#b0d2c6" opacity=".14"/></pattern>
          <filter id="isles-shadow" x="-80%" y="-100%" width="260%" height="320%"><feGaussianBlur stdDeviation="11"/></filter>
          <filter id="isles-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="5"/></filter>
        </defs>

        <rect width="1200" height="720" fill="url(#isles-sea)"/>
        <rect width="1200" height="720" fill="url(#isles-grid)"/>
        <rect width="1200" height="720" fill="url(#isles-dots)"/>

        <!-- Ocean contours and quiet current lines establish an explorable miniature world. -->
        <g stroke="#7eaca8" stroke-opacity=".11" stroke-width="1.5">
          <path d="M-40 385C114 280 123 373 211 257S409 139 499 82 599 6 733 17"/>
          <path d="M-18 417C109 323 160 379 232 282S410 164 511 105 645 23 747 44"/>
          <path d="M378 712C373 641 469 622 591 630S811 634 883 653 1067 711 1199 614"/>
          <path d="M404 719C397 661 482 644 605 653S805 657 878 674 1081 731 1202 642"/>
          <path d="M1143 73C1070 66 1085 122 1121 152S1183 198 1221 160"/>
          <path d="M1148 49C1046 47 1062 134 1101 166S1194 225 1230 180"/>
          <path d="M42 598l44-25m-16 43 44-25m718-483 37-21m-37 35 37-21"/>
        </g>

        <!-- Copper cables double as the campaign route, with power controlled by real progress. -->
        {#each routes as path, i}
          <g class:route-powered={completed.includes(stations[i].id)}>
            <path d={path} stroke="#07161e" stroke-width="21"/>
            <path d={path} stroke="#334b51" stroke-width="12"/>
            <path class="route-copper" d={path} stroke="#a56e4a" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"/>
            <path class="route-current" d={path} stroke="#94e3bd" stroke-width="4" stroke-dasharray="4 44" stroke-linecap="round"/>
          </g>
        {/each}

        <!-- Home beacon: a silent landmark, independent of the seven playable stations. -->
        <g transform="translate(219 177)">
          <ellipse cy="57" rx="101" ry="37" fill="#06151b" opacity=".45" filter="url(#isles-shadow)"/>
          <path d="M-91 17L-34-17 54-16 95 13 95 39 15 79-91 40Z" fill="#344b4d"/>
          <path d="M-91 17L-34-17 54-16 95 13 15 55Z" fill="#75978a"/>
          <path d="M-91 17L15 55V79L-91 40Z" fill="#405a56"/>
          <path d="M-76 16L-27-9 45-9 78 13 14 44Z" fill="#90aa94"/>
          <path d="M-40 14L-6-3 35 17 1 35Z" fill="#c8b793"/>
          <path d="M-16-51L7-64 30-51V10L7 23-16 10Z" fill="#d7cbaa"/>
          <path d="M7-38L30-51V10L7 23Z" fill="#9f9c83"/>
          <path d="M-22-63L7-79 36-63V-44L7-28-22-44Z" fill="#243e44"/>
          <path d="M-16-60L4-71V-45L-16-34Z" fill="#98e4ba"/>
          <path d="M10-71L30-60V-44L10-33Z" fill="#6bbaa0"/>
          <path d="M-30-64L7-85 44-64 7-43Z" fill="#dd8658"/>
          <path d="M7-102V-85" stroke="#e3a06c" stroke-width="3"/>
          <circle cx="7" cy="-105" r="4" fill="#a2e0bb"/>
          <path d="M37-55L140-91 141-24Z" fill="#a2e0bb" opacity=".035"/>
          <path d="M-24 38L-49 24-57 29-32 43M37 36L59 25" stroke="#bdcbad" stroke-width="3"/>
          <g stroke="#c5d4b8" stroke-width="2"><path d="M-60 1V-22m-9 7 9-7 9 7M60 9V-7m-7 5 7-5 7 5"/></g>
          <text x="4" y="111" text-anchor="middle" fill="#b4c6bb" font-size="11" letter-spacing="3" font-family="monospace">THE SIGNAL ISLES</text>
        </g>

        <!-- Small outcrops, ferries, and buoys make the space a place, not a node diagram. -->
        <g transform="translate(475 196)">
          <path d="M-31 0L0-15 35 3V18L0 36-31 18Z" fill="#365155"/><path d="M-31 0L0-15 35 3 0 21Z" fill="#72968a"/>
          <path d="M-7 6V-39m0 14 19-10v16L-7-9" stroke="#c59870" stroke-width="3"/>
          <path d="M-5-36l16-8v16l-16 8Z" fill="#df8b61"/>
          <ellipse cy="48" rx="52" ry="13" stroke="#72a4a0" stroke-opacity=".14"/>
        </g>
        <g transform="translate(1133 365)">
          <path d="M-38 0L-11-20 26-11 42 7 42 26 7 43-38 20Z" fill="#355157"/>
          <path d="M-38 0L-11-20 26-11 42 7 7 24Z" fill="#799a8c"/>
          <path d="M-10-5L0-31 12-12 0-5Z" fill="#a2b59a"/>
          <path d="M10 8L20-11 30 8 20 13Z" fill="#9aad91"/>
        </g>
        <g transform="translate(414 590)">
          <ellipse cy="12" rx="50" ry="16" stroke="#8bc4bc" stroke-opacity=".13"/>
          <path d="M-26 0L8-18 28-6 10 10-9 11Z" fill="#d1c5a2"/>
          <path d="M-26 0L10 10 28-6 23 7 9 17-17 9Z" fill="#758e86"/>
          <path d="M-7-6L8-14 17-9 2-1Z" fill="#d37c54"/>
          <path d="M-38 17l-20 9m33-4-18 9" stroke="#91c4bd" stroke-opacity=".3" stroke-linecap="round"/>
        </g>
        <g transform="translate(840 560)"><ellipse cy="15" rx="24" ry="8" stroke="#6a9b98" stroke-opacity=".3"/><path d="M-9 2L0-3 9 2V9L0 14-9 9Z" fill="#a87754"/><path d="M0 1V-21" stroke="#d5af7c" stroke-width="3"/><circle cy="-23" r="4" fill="#abd7ac"/></g>
        <g fill="#4b6c6c"><path d="M59 317l13-8 13 8-13 8Z"/><path d="M1094 618l17-9 17 9-17 9Z"/><path d="M511 71l9-5 9 5-9 5Z"/><path d="M57 650l12-7 12 7-12 7Z"/></g>

        {#each stations as station, index}
          {@const powered = completed.includes(station.id)}
          <g class="station-art" class:powered class:chosen={selected === station.id} transform={`translate(${station.x} ${station.y})`}>
            <ellipse cx="0" cy="43" rx="111" ry="40" fill="#04131b" opacity=".5" filter="url(#isles-shadow)"/>
            <ellipse class="selection-water" cy="28" rx="115" ry="58" stroke="#a5d9bd" stroke-width="1.5" stroke-dasharray="4 8"/>
            <!-- Island strata -->
            <path d="M-101 0L-42-35 30-43 104-2V26L33 69-39 63-101 28Z" fill="#354f52"/>
            <path d="M-101 0L-42-35 30-43 104-2 33 42-39 36Z" fill="url(#isles-land)"/>
            <path d="M-101 0L-39 36 33 42V69L-39 63-101 28Z" fill="#49675e"/>
            <path d="M33 42L104-2V26L33 69Z" fill="#2c4948"/>
            <path d="M-80 1L-39-23 26-30 83-1 29 31-36 26Z" fill="#234448"/>
            <path d="M-73 1L-36-19 26-24 75-1 28 25-35 20Z" fill="#2c5151"/>
            <g stroke="#688575" stroke-width="2"><path d="M-93 20l21 12m8 14 24 13M49 49l21-12m5 1 19-11"/></g>
            <!-- Exact circuit geometry gives the architecture a PCB foundation. -->
            <g stroke="#b78e60" stroke-width="2" stroke-linejoin="round" opacity=".8">
              <path d="M-65 1l19 11 17-10 24 14 28-16 29 16"/>
              <path d="M-54-6l18 10 24-14 26 15 42-24"/>
              <path d="M-20 20l17-10m36 9 21-12"/>
            </g>
            <g class="island-lights" fill="#c2e5b6"><circle cx="-65" cy="1" r="3"/><circle cx="52" cy="16" r="3"/><circle cx="-54" cy="-6" r="2.5"/><circle cx="56" cy="-19" r="2.5"/></g>
            <g stroke="#cab48b" stroke-width="3" stroke-linecap="round"><path d="M-42-29l-11-6m-1 13-11-6m-3 13-11-6M46-32l12-7m1 15 12-7m0 14 12-7"/></g>

            {#if station.id === 'nand'}
              <!-- Origin generator: a warm ceramic logic chip on four industrial feet. -->
              <path d="M-38-24L0-46 39-24V-3L0 20-38-2Z" fill="#a56f4b"/>
              <path d="M-38-24L0-46 39-24 0-1Z" fill="#edcf9e"/>
              <path d="M0-1L39-24V-3L0 20Z" fill="#be9062"/>
              <path d="M-31-31V-64L0-82 31-64V-31L0-13Z" fill="#e3d6b4"/>
              <path d="M0-46L31-64V-31L0-13Z" fill="#b5b298"/>
              <path d="M-31-64L0-82 31-64 0-46Z" fill="#f9e7c0"/>
              <path d="M-15-64L0-73 15-64 0-55Z" fill="#d98c58"/>
              <g stroke="#42564e" stroke-width="4"><path d="M-20-48v11m10-6v11m21-11v11m10-17v11"/></g>
              <circle class="live-bulb" cx="0" cy="-65" r="6" fill="#96e2b7"/>
              <path d="M-51-4l14-8m60 25 14-8" stroke="#e4bc80" stroke-width="5"/>
              <g transform="translate(57 -30)"><path d="M0 0V-32" stroke="#e4c392" stroke-width="3"/><path d="M0-32L21-23 0-13Z" fill="#ee9255"/></g>
            {:else if station.id === 'not'}
              <!-- Inverter tower, with two distinct display states. -->
              <path d="M-30-11L3-30 36-11 3 9Z" fill="#d9b481"/>
              <path d="M-24-68L3-84 30-68V-12L3 4-24-12Z" fill="#c3c5a8"/>
              <path d="M3-52L30-68V-12L3 4Z" fill="#8eaa95"/>
              <path d="M-24-68L3-84 30-68 3-52Z" fill="#ecddb6"/>
              <path d="M-27-71L3-89 34-71 3-53Z" fill="#d58b5b"/>
              <path d="M-18-51L-3-42V-24L-18-33Z" fill="#1d3942"/>
              <path class="signal-window" d="M9-42L24-51V-33L9-24Z" fill="#9de4bd"/>
              <path d="M3-89V-108m-10 7 10-7 10 7" stroke="#e7c493" stroke-width="3"/>
              <path d="M-47-3l16-10v-15m67 31 16-9v-15" stroke="#d6ac75" stroke-width="4"/>
              <circle class="live-bulb" cx="3" cy="-110" r="4" fill="#a7e5bb"/>
            {:else if station.id === 'and'}
              <!-- Two generator stacks feed one industrial receiver. -->
              {#each [-23, 21] as x}
                <g transform={`translate(${x} -12)`}>
                  <path d="M-18-39L0-50 18-39V-8L0 3-18-8Z" fill="#d9caa3"/>
                  <path d="M0-28L18-39V-8L0 3Z" fill="#a5a88e"/>
                  <path d="M-18-39L0-50 18-39 0-28Z" fill="#f0dfb6"/>
                  <path d="M-13-48L0-55 13-48V-39L0-32-13-39Z" fill="#d88d5b"/>
                  <path class="signal-window" d="M-12-25L-4-20V-11L-12-16Z" fill="#a0dfb1"/>
                </g>
              {/each}
              <path d="M-38 2L0 24 39 2" stroke="#ccad78" stroke-width="6"/>
              <path d="M0 24V4m0-1 20-12" stroke="#d9b981" stroke-width="5"/>
              <circle class="live-bulb" cx="0" cy="24" r="6" fill="#a0dfb1"/>
              <path d="M46-12V-39m-5 1 5-4 5 4" stroke="#b4cab0" stroke-width="2"/>
            {:else if station.id === 'or'}
              <!-- Forked radio receiver. -->
              <path d="M-32-12L0-31 33-12V-1L0 18-32-1Z" fill="#b68a60"/>
              <path d="M-26-46L0-61 27-46V-13L0 2-26-13Z" fill="#d6d0ae"/>
              <path d="M0-31L27-46V-13L0 2Z" fill="#96a68e"/>
              <path d="M-26-46L0-61 27-46 0-31Z" fill="#efddb2"/>
              <path d="M0-57V-88m0 13-26-15m26 15 26-15" stroke="#c9ad7b" stroke-width="4"/>
              <circle class="live-bulb" cx="-26" cy="-91" r="5" fill="#9bdfb9"/><circle class="live-bulb" cx="26" cy="-91" r="5" fill="#9bdfb9"/>
              <path d="M-35-104q9-11 18-1m35 0q9-10 18 1" stroke="#a6d5bd" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
              <path d="M-17-35l10 6v12l-10-6Z" fill="#354b4b"/>
              <path class="signal-window" d="M8-29l11-6v12l-11 6Z" fill="#b5e7bc"/>
            {:else if station.id === 'xor'}
              <!-- A paired, asymmetric observatory. -->
              <path d="M-38-20L0-42 39-20V0L0 22-38 0Z" fill="#9f815f"/>
              <path d="M-38-20L0-42 39-20 0 2Z" fill="#d3c69e"/>
              <path d="M-28-35L-7-47 14-35V-15L-7-3-28-15Z" fill="#a6b69e"/>
              <path d="M-28-35q-3-33 22-35 25 8 20 35L-7-23Z" fill="#d4cfaa"/>
              <path d="M-7-70v47l21-12q5-27-21-35" fill="#9bab91"/>
              <path d="M12-47L28-56 44-47V-21L28-12 12-21Z" fill="#c2b696"/>
              <path d="M12-47L28-56 44-47 28-38Z" fill="#e0d1aa"/>
              <path d="M28-56v-29m-8 5 8-5 8 5" stroke="#dca36d" stroke-width="3"/>
              <path class="signal-window" d="M-21-39l9 5v13l-9-5Z" fill="#a8e2b4"/>
              <path d="M-3-54l20-11 3 5-20 11Z" fill="#df925f"/>
              <circle class="live-bulb" cx="28" cy="-86" r="4" fill="#a4dfb2"/>
            {:else if station.id === 'mux'}
              <!-- A signal router with a large movable-looking selection lever. -->
              <path d="M-43-20L0-45 43-20V0L0 25-43 0Z" fill="#a27a56"/>
              <path d="M-43-20L0-45 43-20 0 5Z" fill="#decda4"/>
              <path d="M-31-49L0-67 31-49V-22L0-4-31-22Z" fill="#bac3a5"/>
              <path d="M0-31L31-49V-22L0-4Z" fill="#8ca38f"/>
              <path d="M-31-49L0-67 31-49 0-31Z" fill="#ede0b6"/>
              <path d="M-18-49L0-59 18-49 0-39Z" fill="#304b4c"/>
              <path d="M0-49L20-81" stroke="#dba271" stroke-width="6" stroke-linecap="round"/>
              <path d="M10-82L20-88 30-82V-72L20-66 10-72Z" fill="#e39462"/>
              <g stroke="#e7bc80" stroke-width="5"><path d="M-43-8l-16-9m16 20-16-9M43-8l16-9"/></g>
              <path class="signal-window" d="M-23-37l10 6v10l-10-6Z" fill="#a4dfb3"/>
            {:else}
              <!-- The terminal signal depot, with two destination towers. -->
              <path d="M-45-16L0-42 45-16V0L0 26-45 0Z" fill="#9a7c57"/>
              <path d="M-45-16L0-42 45-16 0 10Z" fill="#d4c6a1"/>
              <path d="M-11-30L10-42 31-30V-11L10 1-11-11Z" fill="#aab79e"/>
              <path d="M-11-30L10-42 31-30 10-18Z" fill="#e0d4ad"/>
              <path d="M10-36V-61L-24-81m34 20 29-17" stroke="#d5ad75" stroke-width="5" stroke-linecap="round"/>
              {#each [-24, 39] as x}
                <g transform={`translate(${x} ${x === -24 ? -81 : -78})`}>
                  <path d="M-11-9L0-15 11-9V5L0 11-11 5Z" fill="#bbc7a7"/>
                  <path d="M-11-9L0-15 11-9 0-3Z" fill="#f0deb1"/>
                  <path class="signal-window" d="M-8-6L-2-3V5L-8 2Z" fill="#9cdeb4"/>
                </g>
              {/each}
              <path d="M-44 1l15 9m49 7 13-7" stroke="#c69764" stroke-width="4"/>
              <path d="M-53-15V-43m0 0 18 9-18 9Z" stroke="#d4b88b" stroke-width="2" fill="#d9895c"/>
            {/if}

            <!-- Miniature vegetation and edge chips. -->
            <g transform={`translate(${index % 2 === 0 ? -65 : 66} ${index % 2 === 0 ? 8 : -7})`}>
              <path d="M0 2v-19" stroke="#d0b78a" stroke-width="2"/>
              <path d="M-10-11L0-35 10-11 0-5Z" fill="#648c77"/>
              <path d="M0-35L10-11 0-5Z" fill="#9bb495"/>
            </g>
            <path d="M-54 24l12-7 9 5-12 7Z" fill="#c3ba94"/>
            <path d="M55 16l12-7 9 5-12 7Z" fill="#839a86"/>
            <g class="powered-spark"><circle cy="-98" r="19" fill="#a4ebbc" opacity=".08"/><path d="M-5-98l4 4 8-10" stroke="#b8f0c9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></g>
          </g>
        {/each}

        <!-- Compass, map annotations, and scene frame. -->
        <g transform="translate(92 102)" stroke="#83a39f" opacity=".5"><path d="M0-21V21M-21 0H21"/><path d="M0-14l5 14-5-3-5 3Z" fill="#b8caba" stroke="none"/><circle r="26" stroke-dasharray="1 6"/><text y="-34" text-anchor="middle" fill="#a8beb5" stroke="none" font-family="monospace" font-size="10">N</text></g>
        <g fill="#a1b7ad" opacity=".6" font-family="monospace" font-size="10" letter-spacing="2"><text x="79" y="666">ARCHIPELAGO 01</text><text x="1011" y="666">LOGIC SEA</text></g>
        <path d="M80 680h92m-92-4v8m46-8v8m46-8v8" stroke="#8ba69e" stroke-opacity=".4"/>
        <path d="M310 40h92m-92 0v6m92-6v6" stroke="#7b9c98" stroke-opacity=".25"/>
      </svg>

      {#each stations as station}
        {@const powered = completed.includes(station.id)}
        <button
          type="button"
          class="station-button"
          class:is-selected={selected === station.id}
          class:is-powered={powered}
          style={`--station-x:${station.x / 12}%;--station-y:${station.y / 7.2}%`}
          aria-label={`${station.number}. ${station.name}: ${station.title}${powered ? '. Restored' : ''}`}
          aria-pressed={selected === station.id}
          onclick={() => onselect(station.id)}
        >
          <span class="station-target" aria-hidden="true"><span class="target-corner"></span></span>
          <span class="station-label"><span class="station-number">{powered ? '✓' : station.number}</span><span class="station-name">{station.name}</span><span class="station-arrow" aria-hidden="true">↗</span></span>
          <span class="station-caption">{station.title}</span>
        </button>
      {/each}
    </div>
  </div>
  <div class="mobile-stations" aria-label="World stations">
    {#each stations as station}
      <button type="button" class:active={selected === station.id} onclick={() => onselect(station.id)} aria-pressed={selected === station.id}>{completed.includes(station.id) ? '✓' : station.number}<span>{station.name}</span></button>
    {/each}
  </div>
</div>

<style>
  .world-shell{position:relative;width:100%;height:100%;min-height:420px;background:#10212d;isolation:isolate}
  .map-scroll{width:100%;height:100%;overflow:auto;scrollbar-width:thin;scrollbar-color:#526a66 #10212d;outline:none}
  .map-scroll:focus-visible{outline:2px solid #edb784;outline-offset:-3px}
  .map-canvas{position:relative;width:100%;min-width:720px;aspect-ratio:5/3;min-height:432px}
  .world-art{position:absolute;inset:0;width:100%;height:100%;display:block}
  .station-art{transition:filter .25s ease}
  .selection-water{opacity:0;transition:opacity .3s}
  .chosen .selection-water{opacity:.75}
  .chosen{filter:brightness(1.13)}
  .island-lights,.signal-window,.live-bulb{opacity:.28;transition:opacity .7s ease}
  .chosen .island-lights,.chosen .signal-window,.chosen .live-bulb{opacity:.7}
  .powered .island-lights,.powered .signal-window,.powered .live-bulb{opacity:1}
  .powered-spark{opacity:0;transition:opacity .5s}
  .powered .powered-spark{opacity:1}
  .route-current{opacity:0}
  .route-powered .route-current{opacity:.9;animation:current-flow 5s linear infinite}
  .route-powered .route-copper{stroke:#648e76}
  .station-button{position:absolute;left:var(--station-x);top:var(--station-y);width:15%;height:25%;min-width:104px;transform:translate(-50%,-68%);border:0;padding:0;background:transparent;color:#eee7d5;cursor:pointer;display:flex;align-items:center;flex-direction:column;justify-content:flex-end;font-family:inherit;-webkit-tap-highlight-color:transparent;outline:none}
  .station-target{position:absolute;inset:7px 10px 48px;border:1px solid transparent;border-radius:40%;transition:background .2s,border-color .2s}
  .station-button:hover .station-target{background:#adcfb507;border-color:#b9d6bd30}
  .station-button:focus-visible .station-target{outline:3px solid #f4c18b;outline-offset:5px}
  .station-label{display:flex;align-items:center;justify-content:center;gap:8px;min-width:94px;min-height:31px;padding:4px 9px 4px 5px;background:#162b34ed;border:1px solid #72857b70;border-radius:5px;box-shadow:0 3px 12px #07141c4d;transition:background .2s,color .2s,border-color .2s,transform .2s;position:relative;z-index:1;white-space:nowrap}
  .station-number{font:10px/20px ui-monospace,monospace;display:grid;place-items:center;min-width:22px;height:20px;background:#30464a;color:#c1ccba;border-radius:3px;letter-spacing:0}
  .station-name{font-size:12px;font-weight:700;letter-spacing:1.2px}
  .station-arrow{font-size:13px;margin-left:auto;opacity:.5}
  .station-caption{font-size:10px;line-height:1.5;color:#a0b7ad;margin-top:4px;white-space:nowrap;text-shadow:0 1px 5px #06171f}
  .station-button:hover .station-label{transform:translateY(-2px);border-color:#edb784;color:#fff5dd}
  .is-selected .station-label{background:#f1dfba;border-color:#f1dfba;color:#243b3e;box-shadow:0 3px 0 #a47850,0 8px 18px #07141c55}
  .is-selected .station-number{background:#dba273;color:#243b3e}
  .is-selected .station-caption{color:#e3cba4}
  .is-powered:not(.is-selected) .station-number{color:#bcf0cc;background:#356052}
  .mobile-stations{display:none}
  @keyframes current-flow{to{stroke-dashoffset:-192}}
  @media(min-width:1500px){.station-name{font-size:14px}.station-label{min-height:35px}.station-caption{font-size:12px}}
  @media(max-width:700px){
    .world-shell{min-height:0}
    .map-scroll{height:440px}
    .map-canvas{width:735px;min-width:735px;min-height:441px}
    .station-button{height:27%;transform:translate(-50%,-64%)}
    .station-label{min-width:83px;gap:5px;min-height:29px;padding-right:7px}
    .station-name{font-size:11px}
    .station-number{font-size:9px;min-width:19px;height:18px}
    .station-caption{font-size:9px}
    .mobile-stations{display:flex;gap:6px;padding:12px 14px 14px;overflow:auto;border-top:1px solid #6f8b7e26}
    .mobile-stations button{flex:none;display:flex;align-items:center;gap:7px;border:1px solid #57746c66;border-radius:5px;background:#203941;color:#b9c7b7;padding:9px 10px;font:10px ui-monospace,monospace}
    .mobile-stations button span{font:600 11px system-ui,sans-serif}
    .mobile-stations button.active{background:#eddbb8;color:#243b3e;border-color:#eddbb8}
    .mobile-stations button:focus-visible{outline:2px solid #efb17b;outline-offset:2px}
  }
  @media(prefers-reduced-motion:reduce){.route-powered .route-current{animation:none}.station-art,.selection-water,.island-lights,.signal-window,.live-bulb,.powered-spark,.station-target,.station-label{transition:none}}
</style>
