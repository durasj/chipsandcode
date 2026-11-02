<script lang="ts">
  import { getMission } from './missions';

  export let missionId: string;
  export let outputs: Record<string, boolean> | null;
  export let inputs: Record<string, boolean>;
  export let certified = false;

  type Sample = { inputs: Record<string, boolean>; outputs: Record<string, boolean> | null };
  let samples: Sample[] = [];
  let lastSignature = '';
  $: mission = getMission(missionId);
  $: capture(inputs, outputs);
  $: channels = [
    ...mission.inputs.map((pin) => ({ pin, kind: 'inputs' as const })),
    ...mission.outputs.map((pin) => ({ pin, kind: 'outputs' as const })),
  ];

  function capture(
    nextInputs: Record<string, boolean>,
    nextOutputs: Record<string, boolean> | null,
  ) {
    const signature = JSON.stringify([nextInputs, nextOutputs]);
    if (signature === lastSignature) return;
    lastSignature = signature;
    samples = [
      ...samples,
      { inputs: { ...nextInputs }, outputs: nextOutputs ? { ...nextOutputs } : null },
    ].slice(-12);
  }

  function trace(pin: string, kind: 'inputs' | 'outputs', row: number): string {
    let path = '';
    let previousKnown = false;
    samples.forEach((sample, index) => {
      const value = sample[kind]?.[pin];
      const x = 70 + (12 - samples.length + index) * 15;
      const y = 27 + row * 31 + (value ? 0 : 14);
      if (value === undefined) {
        previousKnown = false;
        return;
      }
      path += `${previousKnown ? ' L' : ' M'} ${x} ${y} L ${x + 15} ${y}`;
      previousKnown = true;
    });
    return path;
  }
</script>

<div class="bench-machine" aria-label="Live logic analyzer">
  <div class="analyzer-header">
    <span>LOGIC ANALYZER</span><span class:verified={certified}
      >{certified ? 'VERIFIED' : outputs ? 'LIVE' : 'IDLE'}</span
    >
  </div>
  <svg
    viewBox={`0 0 290 ${channels.length * 31 + 50}`}
    role="img"
    aria-label={`Last ${samples.length} signal changes. Current outputs: ${
      outputs
        ? Object.entries(outputs)
            .map(([pin, value]) => `${pin} ${Number(value)}`)
            .join(', ')
        : 'unconnected'
    }`}
  >
    <rect x="66" y="15" width="188" height={channels.length * 31 + 12} fill="#0c0f18" />
    {#each Array(13) as _, index}<path
        d={`M ${70 + index * 15} 15 V ${channels.length * 31 + 27}`}
        stroke="#222638"
        stroke-width=".6"
      />{/each}
    {#each channels as channel, index}
      <text
        x="0"
        y={38 + index * 31}
        class="channel-name"
        class:output-channel={channel.kind === 'outputs'}>{channel.pin}</text
      >
      <path d={`M 70 ${41 + index * 31} H 250`} stroke="#292c3f" stroke-width=".6" />
      <path
        d={trace(channel.pin, channel.kind, index)}
        fill="none"
        stroke={channel.kind === 'outputs' ? '#b6a3ff' : '#8190bb'}
        stroke-width="1.7"
      />
      <text x="278" y={38 + index * 31} text-anchor="middle" class="channel-state"
        >{channel.kind === 'inputs'
          ? Number(inputs[channel.pin])
          : outputs
            ? Number(outputs[channel.pin])
            : '—'}</text
      >
    {/each}
  </svg>
  <div class="analyzer-foot">
    <span>{samples.length} / 12 CHANGES</span><span>INPUT → OUTPUT</span>
  </div>
</div>

<style>
  .bench-machine {
    min-width: 0;
  }
  .analyzer-header,
  .analyzer-foot {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    color: #a7abc0;
    font: 11px/1.5 monospace;
    letter-spacing: 0.8px;
  }
  .analyzer-header span:last-child {
    color: #afa2ef;
  }
  .analyzer-header .verified {
    color: #c7b7ff;
  }
  svg {
    display: block;
    width: 100%;
    margin: 11px 0 6px;
    max-height: 235px;
  }
  .channel-name {
    fill: #a7b1ce;
    font: 12px monospace;
  }
  .output-channel {
    fill: #c1afff;
  }
  .channel-state {
    fill: #e6e1f7;
    font: 12px monospace;
  }
  .analyzer-foot {
    color: #9ba0b5;
    font-size: 10px;
  }
</style>
