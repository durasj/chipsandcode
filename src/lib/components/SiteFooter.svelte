<footer class="site-footer">
  <span>Chips and Code</span>
  <div>
    <a href="/accessibility-statement">Accessibility</a>
    <a href="https://github.com/durasj/chipsandcode"
      >Source code <span aria-hidden="true">↗</span></a
    >
  </div>
</footer>

<style>
  .site-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
    border-top: 1px solid #333b51;
    padding: 30px 4%;
    background: #080b13;
    color: #b7bfd3;
    font-size: 12px;
  }
  .site-footer > div {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
  }
  a {
    text-decoration: none;
    padding: 6px 0;
  }
  a:hover {
    color: #fff;
    text-decoration: underline;
    text-underline-offset: 5px;
  }
  @media (max-width: 520px) {
    .site-footer {
      padding: 26px 20px;
    }
  }
</style>
