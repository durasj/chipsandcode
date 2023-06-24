---
title: Boolean Logic
updated: 2022-06-26
copyright: Adapted by <a href="https://jan.duras.me" class="link">Jan Duras</a> from <a href="https://www.nand2tetris.org/license" class="link">Nand to Tetris</a> by Shimon Schocken and Noam Nisan. <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" class="link">CC BY-NC-SA 3.0</a>
course: Hardware
menu:
  - name: Boolean Logic
    link: /hardware/boolean-logic
    label: 1
  - name: Background
    link: /hardware/boolean-logic/background
    label: 1.1
  - name: Specification
    link: /hardware/boolean-logic/background
    label: 1.2
  - name: Implementation
    link: /hardware/boolean-logic/background
    label: 1.3
  - name: Perspective
    link: /hardware/boolean-logic/background
    label: 1.4
  - name: Project
    link: /hardware/boolean-logic/background
    label: 1.5
---

> Such simple things, And we make of them something so complex it defeats us, Almost.

-- John Ashbery (b. 1927), American poet

Every digital device — be it a personal computer, a cellular telephone, or a network router — is based on a set of chips designed to store and process information. Although these chips come in different shapes and forms, they are all made from the same building blocks: Elementary _logic gates_. The gates can be physically implemented in many different materials and fabrication technologies, but their logical behavior is consistent across all computers. In this chapter we start out with one primitive logic gate — Nand — and build all the other logic gates from it. The result is a rather standard set of gates, which will be later used to construct our computer’s processing and storage chips. This will be done in chapters 2 and 3, respectively, that are coming soon.

All the hardware chapters in the course, beginning with this one, have the same structure. Each chapter focuses on a well-defined task, designed to construct or integrate a certain family of chips. The prerequisite knowledge needed to approach this task is provided in a brief Background section. The next section provides a complete Specification of the chips abstractions, namely, the various services that they should deliver, one way or another. Having presented the _what_, a subsequent Implementation section proposes guidelines and hints about _how_ the chips can be actually implemented. A Perspective section rounds up the chapter with concluding comments about important topics that were left out from the discussion. Each chapter ends with a technical Project section. This section gives step-by-step instructions for actually building the chips using the integrated hardware simulator.

This being the first hardware chapter in the course, the Background section is somewhat lengthy, featuring a special section on _hardware description and simulation tools_.
