### Gate Logic

A _gate_ is a physical device that implements a Boolean function. If a Boolean function $f$ operates on $n$ variables and returns $m$ binary results (in all our examples so far, $m$ was 1), the gate that implements $f$ will have $n$ _input pins_ and $m$ _output pins_. When we put some values $v_1 ... v_n$ in the gate’s input pins, the gate’s ‘‘logic’’ -- its internal structure -- should compute and output $f(v_1 ... v_n)$. And just like complex Boolean functions can be expressed in terms of simpler functions, complex gates are composed from more elementary gates. The simplest gates of all are made from tiny switching devices, called _transistors_, wired in a certain topology designed to effect the overall gate functionality.

Although most digital computers today use electricity to represent and transmit
binary data from one gate to another, any alternative technology permitting switching and conducting capabilities can be employed. Indeed, during the last fifty years, researchers have built many hardware implementations of Boolean functions, including magnetic, optical, biological, hydraulic, and pneumatic mechanisms. Today, most gates are implemented as transistors etched in silicon, packaged as _chips_. In this book we use the words _chip_ and _gate_ interchangeably, tending to use the term _gates_ for simple chips.

The availability of alternative switching technology options, on the one hand, and the observation that Boolean algebra can be used to abstract the behavior of _any_ such technology, on the other, is extremely important. Basically, it implies that computer scientists don’t have to worry about physical things like electricity, circuits, switches, relays, and power supply. Instead, computer scientists can be content with the abstract notions of Boolean algebra and gate logic, trusting that someone else (the physicists and electrical engineers—bless their souls) will figure out how to actually realize them in hardware. Hence, a _primitive gate_ (see figure 1.3) can be viewed as a black box device that implements an elementary logical operation in one way or another—we don’t care how. A hardware designer starts from such primitive gates and designs more complicated functionality by interconnecting them, leading to the construction of _composite_ gates.

![Standard symbolic notation of some elementary logic gates.](/figures/figure1-3.svg 'Figure 1.3: Standard symbolic notation of some elementary logic gates.')
_**Figure 1.3** Standard symbolic notation of some elementary logic gates._

![Composite implementation of a three-way And gate. The rectangle on the right defines the conceptual boundaries of the gate interface.](/figures/figure1-4.svg 'Figure 1.4: Composite implementation of a three-way And gate. The rectangle on the right defines the conceptual boundaries of the gate interface.')
_**Figure 1.4** Composite implementation of a three-way And gate. The rectangle on the right defines the conceptual boundaries of the gate interface._

#### Primitive and Composite Gates

Since all logic gates have the same input and output semantics (0’s and 1’s), they can be chained together, creating _composite gates_ of arbitrary complexity. For example, suppose we are asked to implement the 3-way Boolean function And($a, b, c$). Using Boolean algebra, we can begin by observing that $a \cdot b \cdot c = (a \cdot b) \cdot c$, or, using prefix notation, And($a, b, c$) $=$ And(And($a, b$), $c$). Next, we can use this result to construct the composite gate depicted in figure 1.4.

The construction described in figure 1.4 is a simple example of _gate logic_, also called _logic design_. Simply put, logic design is the art of interconnecting gates in
order to implement more complex functionality, leading to the notion of _composite gates_. Since composite gates are themselves realizations of (possibly complex) Boolean functions, their "outside appearance" (e.g., left side of figure 1.4) looks just like that of primitive gates. At the same time, their internal structure can be rather
complex.

We see that any given logic gate can be viewed from two different perspectives: external and internal. The right-hand side of figure 1.4 gives the gate’s internal
architecture, or _implementation_, whereas the left side shows only the gate _interface_, namely, the input and output pins that it exposes to the outside world. The former is
relevant only to the gate designer, whereas the latter is the right level of detail for other designers who wish to use the gate as an abstract off-the-shelf component, without paying attention to its internal structure.

Let us consider another logic design example—that of a Xor gate. As discussed before, Xor($a, b$) is 1 exactly when either $a$ is 1 and $b$ is 0, or when $a$ is 0 and $b$ is 1. Said otherwise, Xor($a, b$) $=$ Or(And($a$, Not($b$)), And(Not($a$), $b$)). This definition leads to the logic design shown in figure 1.5.

Note that the gate _interface_ is unique: There is only one way to describe it, and this is normally done using a truth table, a Boolean expression, or some verbal specification. This interface, however, can be realized using many different _implementations_, some of which will be better than others in terms of cost, speed, and simplicity. For example, the Xor function can be implemented using four, rather than five, And, Or, and Not gates. Thus, from a functional standpoint, the fundamental requirement of logic design is that _the gate implementation will realize its stated interface, in one way or another_. From an efficiency standpoint, the general rule is to try to _do more with less_, that is, use as few gates as possible.

To sum up, the art of logic design can be described as follows: Given a gate specification (interface), find an efficient way to implement it using other gates that were already implemented. This, in a nutshell, is what we will do in the rest of this chapter
