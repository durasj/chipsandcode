<script lang="ts">
  const classes = $$restProps.class ? Object.keys($$restProps.class).join(' ') : '';
</script>

<div class="flex flex-col md:flex-row {classes}">
  <slot />
</div>
