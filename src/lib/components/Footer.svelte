<script>
  import { Icon } from '@steeze-ui/svelte-icon';
  import { Github } from '@steeze-ui/remix-icons';
</script>

<footer class="flex flex-row justify-between items-center max-w-7xl mx-auto p-4 w-full text-sm">
  <div>
    © 2021 <a href="https://duras.me" target="_blank" rel="external" class="link link-hover"
      >Jakub Duras</a
    >
  </div>
  <div class="gap-4">
    <a
      href="https://github.com/durasj/chipsandcode"
      target="_blank"
      rel="external"
      class="btn btn-ghost btn-circle"
      title="Github repository"
      aria-label="Github repository"
      ><Icon src={Github} theme="solid" class="h-8" />
    </a>
  </div>
</footer>
