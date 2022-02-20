# Boolean Logic

> Such simple things, And we make of them something so complex it defeats us, Almost.

-- John Ashbery (b. 1927), American poet

Every digital devicebe it a personal computer, a cellular telephone, or a network routeris based on a set of chips designed to store and process information. Although these chips come in different shapes and forms, they are all made from the same building blocks: Elementary _logic gates_. The gates can be physically implemented in many different materials and fabrication technologies, but their logical behavior is consistent across all computers. In this chapter we start out with one primitive logic gateNandand build all the other logic gates from it. The result is a rather standard set of gates, which will be later used to construct our computers processing and storage chips. This will be done in chapters 2 and 3, respectively.

All the hardware chapters in the book, beginning with this one, have the same structure. Each chapter focuses on a well-defined task, designed to construct or integrate a certain family of chips. The prerequisite knowledge needed to approach this task is provided in a brief Background section. The next section provides a complete Specification of the chips abstractions, namely, the various services that they should deliver, one way or another. Having presented the _what_, a subsequent Implementation section proposes guidelines and hints about _how_ the chips can be actually implemented. A Perspective section rounds up the chapter with concluding comments about important topics that were left out from the discussion. Each chapter ends with a technical Project section. This section gives step-by-step instructions for actually building the chips on a personal computer, using the hardware simulator supplied with the book.

This being the first hardware chapter in the book, the Background section is somewhat lengthy, featuring a special section on _hardware description and simulation tools_.
