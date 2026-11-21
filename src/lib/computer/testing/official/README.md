# Official hardware contract fixtures

These unchanged `.tst` and `.cmp` files are from the official
[nand2tetris/projects](https://github.com/nand2tetris/projects) repository,
commit `5bd2184edfd4945ff8a28eb0b237c12cdbe9e498`, projects 01, 02, 03,
and project 05's test, comparison, and machine-code program files. Original attribution comments and the
repository's MIT `LICENSE` are retained here. No completed student HDL solutions
are included.

`hdl.test.ts` constructs a generic Probe around each primitive and executes every
set/eval/tick/tock/output command against the supplied expected output. It skips
only file-selection directives, parses the declared output columns (comparison
headers may be truncated), and deliberately ignores wildcard comparison cells and
the display-only time column. Unknown commands throw rather than silently skip.

Separate structural tests verify bus slices, internal wires, dependency graphs,
clocked feedback, synchronous state changes, mapped memory, and ROM-backed computer
execution. The fixture suite tests the builtin contracts; it does not assert that
all possible user circuits are correct.

`testing.test.ts` also exercises the production TDL runner against all Part I hardware scripts, including CPU internal-state inspection, ROM-loading Computer tests, repeated clock cycles, and the interactive Memory test with controlled keyboard responses. Test-language semantics were cross-checked against the MIT-licensed [official web IDE](https://github.com/nand2tetris/web-ide) grammar and chip test runner. The new parser and runner are independent implementations; no web-IDE source code is bundled here.
