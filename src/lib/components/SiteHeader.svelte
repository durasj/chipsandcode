<script lang="ts">
  import { page } from '$app/state';
  let pathname = $derived(page.url.pathname);

  const links = [
    { label: 'Learn', href: '/learn' },
    { label: 'Tools', href: '/tools' },
    { label: 'About', href: '/about' },
  ];
</script>

<a class="skip-link" href="#page-content">Skip to content</a>
<header class="site-header">
  <a class="brand" href="/" aria-label="Chips and Code home">
    <img src="/logo.svg" alt="" width="34" height="34" />
    <span>Chips <span class="brand-and">and</span> Code</span>
  </a>
  <nav aria-label="Main navigation">
    {#each links as link}
      <a
        href={link.href}
        aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`)
          ? 'page'
          : undefined}>{link.label}</a
      >
    {/each}
  </nav>
</header>

<style>
  .site-header {
    min-height: 84px;
    max-width: 1600px;
    width: 100%;
    margin: auto;
    padding: 15px 4%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
    background: #080b13;
    color: #f4f3ff;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    font-size: 19px;
    font-weight: 650;
    letter-spacing: -0.55px;
    text-decoration: none;
    white-space: nowrap;
  }
  .brand img {
    width: 34px;
    height: 34px;
  }
  .brand-and {
    font-weight: 400;
    color: #b8bfd1;
  }
  nav {
    display: flex;
    align-items: center;
    gap: clamp(20px, 3.5vw, 45px);
  }
  nav a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    border-bottom: 2px solid transparent;
    color: #c1c8da;
    font-size: 14px;
    text-decoration: none;
  }
  nav a:hover,
  nav a[aria-current] {
    color: #fff;
    border-color: #a99fff;
  }
  .skip-link {
    position: fixed;
    z-index: 1000;
    top: 8px;
    left: 20px;
    transform: translateY(-150%);
    padding: 12px 18px;
    color: #111427;
    background: #eeeaff;
  }
  .skip-link:focus {
    transform: none;
  }
  @media (max-width: 520px) {
    .site-header {
      min-height: 108px;
      padding: 16px 20px 10px;
      gap: 8px;
      flex-wrap: wrap;
    }
    .brand {
      font-size: 17px;
      gap: 8px;
    }
    .brand img {
      width: 29px;
      height: 29px;
    }
    nav {
      width: 100%;
      justify-content: space-between;
      max-width: 280px;
      gap: 25px;
    }
    nav a {
      font-size: 13px;
      min-height: 38px;
    }
  }
</style>
