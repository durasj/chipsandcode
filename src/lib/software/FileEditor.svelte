<script lang="ts">
  export let files: Record<string, string> = {};
  export let extension = 'vm';
  export let onchange: () => void = () => {};
  let active = Object.keys(files)[0] ?? '';
  let newName = '';
  let error = '';
  let importing = false;
  $: if (!(active in files)) active = Object.keys(files)[0] ?? '';
  function edit(event: Event) {
    files = { ...files, [active]: (event.currentTarget as HTMLTextAreaElement).value };
    onchange();
  }
  function add() {
    error = '';
    const name = newName.trim();
    if (!new RegExp(`^[A-Za-z_][A-Za-z0-9_]*\\.${extension}$`).test(name)) {
      error = `Use a simple file name ending in .${extension}.`;
      return;
    }
    if (name in files) {
      error = 'That file already exists.';
      return;
    }
    if (Object.keys(files).length >= 50) {
      error = 'Keep a project to at most 50 files.';
      return;
    }
    files = { ...files, [name]: '' };
    active = name;
    newName = '';
    onchange();
  }
  function remove() {
    const next = { ...files };
    delete next[active];
    files = next;
    onchange();
  }
  async function upload(event: Event) {
    if (importing) return;
    importing = true;
    const input = event.currentTarget as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    const before = { ...files };
    error = '';
    try {
      if (
        selected.length + Object.keys(files).length > 50 ||
        selected.reduce((n, f) => n + f.size, 0) > 1000000
      )
        throw new Error('Choose at most 50 files and 1 MB of source.');
      const imported: Record<string, string> = {};
      for (const file of selected) {
        if (!new RegExp(`^[A-Za-z_][A-Za-z0-9_]*\\.${extension}$`).test(file.name))
          throw new Error(`Choose .${extension} source files with simple names.`);
        imported[file.name] = await file.text();
      }
      for (const name of Object.keys(imported)) {
        if (files[name] !== before[name])
          throw new Error(
            `${name} changed while its import was loading. Your edits were kept; import again when ready.`,
          );
      }
      const next = { ...files, ...imported };
      if (Object.keys(next).length > 50) throw new Error('Keep a project to at most 50 files.');
      files = next;
      if (selected[0]) active = selected[0].name;
      onchange();
    } catch (problem) {
      error = problem instanceof Error ? problem.message : String(problem);
    }
    input.value = '';
    importing = false;
  }
</script>

<div class="field-row">
  <label
    >Source file<select bind:value={active}
      >{#each Object.keys(files) as name (name)}<option value={name}>{name}</option>{/each}</select
    ></label
  >
</div>
<label
  >Source code<textarea
    value={files[active] ?? ''}
    on:input={edit}
    disabled={!active}
    spellcheck="false"
    autocapitalize="off"
    autocomplete="off"
    aria-label="Source code"
  ></textarea></label
>
<details>
  <summary>Project files</summary>
  <div class="field-row">
    <label
      >New file name<input
        type="text"
        bind:value={newName}
        placeholder={`Name.${extension}`}
      /></label
    ><button class="action" on:click={add}>Add file</button>
  </div>
  <div class="field-row">
    <label
      >Import source files<input
        type="file"
        multiple
        disabled={importing}
        accept={`.${extension}`}
        on:change={upload}
      /></label
    ><button class="action" on:click={remove} disabled={Object.keys(files).length <= 1}
      >Remove selected file</button
    >
  </div>
</details>
{#if error}<p class="error" role="alert">{error}</p>{/if}
