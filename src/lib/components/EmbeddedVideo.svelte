<script lang="ts">
  export let id: string;
</script>

<iframe
  src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
  class="not-prose relative w-full 2xl:w-[260%] 2xl:-left-[80%] xl:w-[220%] xl:-left-[60%] lg:w-[174%] lg:-left-[37%] md:w-[120%] md:-left-[10%] min-h-[40rem] z-10 my-12"
  title="YouTube video player"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen
/>
