# Nand2Tetris reference runtime

Source: https://github.com/nand2tetris/web-ide/tree/2070cd89065e49074563b33c7ca066d953aa8a8a/simulator/src

Pinned commit: `2070cd89065e49074563b33c7ca066d953aa8a8a`. This directory retains only the dependency closure of the Jack compiler, VM parser, VM emulator, and native OS. The upstream UI, runner, and project corpus are not included.

The repository MIT license is retained as LICENSE with original attribution and antecedent links. Upstream simulator/package.json declares ISC; the repository root supplies the included MIT license. Source headers are retained. External runtime dependencies remain separately installed and licensed: @davidsouther/jiffies 2026.26.1 and ohm-js 17.5.0.

Local integration changes:

- VM exposes halted/blocked status and disposal, without changing instruction semantics.
- Sys.wait keeps and cancels its timeout on disposal, preventing late callbacks after reset/navigation.
- Type-only imports are explicit for the host's verbatimModuleSyntax setting.
- SubMemory range/loading stays within its own offset and size; clearing the screen must not clear heap RAM or the keyboard. Memory offset loading clears only beyond the loaded region.
- Screen boundary validation excludes x=512 and y=256. Runtime OS errors are surfaced by the adapter.

This vendor directory is excluded from first-party coverage accounting. The public adapter is covered by integration tests that compile and execute multi-file Jack and exercise VM arithmetic, segments, calls, returns, OS drawing, memory, strings, and errors.
