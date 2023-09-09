<script lang="ts">
  export let name: string;
  export let label: string;
</script>

<figure>
  <slot />
  <figcaption class="text-base italic text-base-content">
    <span class="font-bold">{name}</span>: {label}
  </figcaption>
</figure>
