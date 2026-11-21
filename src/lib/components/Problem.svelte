<script lang="ts">
  export let message: string;
</script>

<section class="problem" role="alert">
  <h2>This could not be opened.</h2>
  <p>{message}</p>
  <div>
    <button onclick={() => location.reload()}>Try again</button><a href="/tools">Back to Tools</a>
  </div>
</section>

<style>
  .problem {
    width: min(100%, 760px);
    margin: 40px auto;
    padding: 28px;
    color: #ececf6;
  }
  h2 {
    font-size: 30px;
    font-weight: 500;
    line-height: 1.2;
    margin: 0 0 22px;
  }
  p {
    color: #c7cfe0;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }
  .problem > div {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
    margin-top: 28px;
  }
  button {
    border: 1px solid #8f84db;
    background: #4f46e5;
    color: #fff;
    padding: 12px 18px;
    border-radius: 3px;
  }
  a {
    color: #c8beff;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
</style>
