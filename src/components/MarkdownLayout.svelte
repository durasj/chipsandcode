<!-- Workaround for https://github.com/pngwn/MDsveX/issues/116 -->
<script lang="ts">
  // @ts-nocheck
  import LearnLayout from './LearnLayout.svelte';

  export let title;
  export let updated;
  export let copyright;
  export let course;
  export let menu;
</script>

<LearnLayout {title} {updated} {copyright} {course} {menu}>
  <slot />
</LearnLayout>
