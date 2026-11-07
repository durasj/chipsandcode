---
title: Beyond the assembler
updated: 2026-11-03
---

The path now connects signals to an assembler: gates combine into arithmetic, clocked storage keeps state, a CPU follows instructions, and a translator turns symbolic programs into machine words.

# Finish the hardware and assembler path

[Open the learning path](/learn/path) to continue through multi-bit logic, arithmetic, memory, machine language, computer architecture, and assembly translation. Each layer has a full explanation in this reference.

Use the [chip builder](/tools/chip-builder) for multi-bit and clocked HDL experiments, including TST scripts and CMP comparisons. Use the [computer and assembler](/tools/computer) for instruction translation, execution, RAM, screen, and keyboard inspection. The [Boolean functions](/tools/boolean-functions) and [buses and routing](/tools/buses) tools let you explore behavior before constructing an implementation.

Keep the distinction between a working reference model and your own construction. Running a program on a built-in CPU demonstrates the program's behavior. Validating your HDL CPU requires running that construction against its contract. Similarly, translating a program with the supplied assembler is different from implementing and testing your own translator.

# The next software layers

Nand2Tetris continues beyond Project 6:

| Projects | Layer | What it adds |
| --- | --- | --- |
| 7–8 | Virtual machine | Stack arithmetic, memory segments, branches, function calls, and returns |
| 9 | High-level programming | Programs written in Jack rather than assembly |
| 10–11 | Compiler | Parsing Jack and generating executable VM code |
| 12 | Operating-system services | Memory allocation, arithmetic helpers, strings, screen output, and keyboard input |

The guided lessons stop at Project 6. You can already explore the later layers with the [VM emulator](/tools/vm), [Jack compiler](/tools/compiler), and [bitmap editor](/tools/bitmap). Compile Jack into VM code, open it in the emulator, or draw a sprite and inspect the code that puts it on screen. Follow the [official course](https://www.nand2tetris.org/course) for Projects 7–12 and their construction assignments.

# Take your work further

Use the [official project files](https://github.com/nand2tetris/projects) and [online tools](https://www.nand2tetris.org/software) to compare your work with the course's contracts. The official tests make projects portable; a visual success in one interface is not a replacement for checking the required behavior.

Chips and Code is independent and is not affiliated with or endorsed by Nand2Tetris. The curriculum draws on work by Noam Nisan and Shimon Schocken. Adapted explanations retain [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/); imported software assets retain their source licenses. The authors ask learners not to publish completed exercise solutions, preserving the construction challenge for others.

# Help improve this project

[Report a problem](https://github.com/durasj/chipsandcode/issues), [join the discussion](https://github.com/durasj/chipsandcode/discussions), or [contribute](https://github.com/durasj/chipsandcode). Include the smallest example that shows the problem and the behavior you expected. For a learning issue, describe the first concept or control that became unclear.
