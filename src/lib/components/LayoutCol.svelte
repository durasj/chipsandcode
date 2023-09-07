<script lang="ts">
  const classes = $$restProps.class ? Object.keys($$restProps.class).join(' ') : '';
</script>

<div class={classes}>
  <slot />
</div>
