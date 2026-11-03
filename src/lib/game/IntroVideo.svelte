<script lang="ts">
  import { onMount } from 'svelte';

  export let onclose: () => void;
  let dialog: HTMLDialogElement;
  let video: HTMLVideoElement;
  let unavailable = false;

  onMount(() => {
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    void video.play().catch(() => {
      /* Native controls remain available. */
    });
    return () => {
      video.pause();
      document.body.style.overflow = previousOverflow;
    };
  });
</script>

<dialog bind:this={dialog} aria-labelledby="intro-title" on:close={onclose}>
  <div class="intro-heading">
    <div>
      <h2 id="intro-title">From signals to software</h2>
      <p>Visual introduction · 48 seconds</p>
    </div>
    <button class="close-intro" aria-label="Close introduction" on:click={() => dialog.close()}
      >×</button
    >
  </div>
  <video
    bind:this={video}
    controls
    playsinline
    preload="none"
    poster="/media/computer-intro-poster.jpg"
    aria-label="A journey through the layers of a computer"
    on:error={() => (unavailable = true)}
  >
    <source src="/media/computer-intro.mp4" type="video/mp4" />
    <track kind="captions" src="/media/computer-intro.vtt" srclang="en" label="English" default />
  </video>
  {#if unavailable}<p class="video-error" role="status">
      The video could not load. Read the transcript below.
    </p>{/if}
  <div class="intro-footer">
    <p>Build through the assembler. High-level software is the next horizon.</p>
    <a href="/media/computer-intro-transcript.txt" target="_blank" rel="noopener"
      >Read transcript ↗</a
    >
  </div>
</dialog>

<style>
  dialog {
    color: #eeedf7;
    background: #0e111b;
    border: 1px solid #484359;
    border-radius: 6px;
    padding: 0;
    width: min(1060px, calc(100vw - 32px));
    max-height: calc(100dvh - 32px);
    margin: auto;
    overflow: auto;
    box-shadow: 0 30px 100px #0009;
    color-scheme: dark;
  }
  dialog::backdrop {
    background: #03040ad9;
    backdrop-filter: blur(7px);
  }
  .intro-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 20px 24px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    letter-spacing: -0.3px;
  }
  .intro-heading p {
    margin: 5px 0 0;
    font-size: 12px;
    color: #a3a5b9;
  }
  .close-intro {
    border: 1px solid #3b3d52;
    border-radius: 3px;
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    color: #e4dfff;
    font-size: 25px;
    line-height: 1;
    cursor: pointer;
  }
  video {
    display: block;
    width: 100%;
    aspect-ratio: 16/9;
    background: #090b11;
  }
  .intro-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 24px;
    font-size: 12px;
  }
  .intro-footer p {
    margin: 0;
    color: #a3a5b9;
  }
  .intro-footer a {
    color: #c2baff;
    white-space: nowrap;
  }
  .video-error {
    padding: 10px 24px;
    color: #f1c7d1;
    font-size: 13px;
  }
  @media (max-width: 520px) {
    dialog {
      width: calc(100vw - 20px);
    }
    .intro-heading {
      padding: 15px;
    }
    h2 {
      font-size: 16px;
    }
    .intro-footer {
      flex-direction: column;
      align-items: flex-start;
      padding: 15px;
    }
  }
</style>
