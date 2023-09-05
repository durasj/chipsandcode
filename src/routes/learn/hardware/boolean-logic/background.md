---
title: Background
updated: 2023-06-26
---

This chapter focuses on the construction of a family of simple chips called _Boolean gates_. Since Boolean gates are physical implementations of _Boolean functions_, we start with a brief treatment of Boolean algebra. We then show how Boolean gates implementing simple Boolean functions can be interconnected to deliver the functionality of more complex chips. We conclude the background section with a description of how hardware design is actually done in practice, using software simulation tools.

# Boolean Algebra

Boolean algebra deals with Boolean (also called binary) values that are typically labeled true/false, 1/0, yes/no, on/off, and so forth. We will use 1 and 0. A Boolean function is a function that operates on binary inputs and returns binary outputs. Since computer hardware is based on the representation and manipulation of binary values, Boolean functions play a central role in the specification, construction, and optimization of hardware architectures. Hence, the ability to formulate and analyze Boolean functions is the first step toward constructing computer architectures.

## Truth Table Representation

The simplest way to specify a Boolean function is to enumerate all the possible values of the function's input variables, along with the function's output for each set of inputs. This is called the _truth table_ representation of the function, illustrated in figure 1.1.

The first three columns of figure 1.1 enumerate all the possible binary values of the function's variables. For each one of the $2^n$ possible tuples $v_1 ... v_n$ (here $n = 3$), the last column gives the value of $f(v_1 ... v_n)$.

## Boolean Expressions

In addition to the truth table specification, a Boolean function can also be specified using Boolean operations over its input variables. The basic Boolean operators that are typically used are "And" ($x$ And $y$ is 1 exactly when both $x$ and $y$ are 1) "Or" ($x$ Or $y$ is 1 exactly when either $x$ or $y$ or both are 1), and "Not" (Not $x$ is 1 exactly when $x$ is 0). We will use a common arithmetic-like notation for these operations: $x \cdot y$ (or $xy$) means $x$ And $y, x + y$ means $x$ Or $y$, and $\bar x$ means Not $x$.

To illustrate, the function defined in figure 1.1 is equivalently given by the Boolean expression $f(x, y, z) = (x + y) \cdot \bar z$. For example, let us evaluate this expression on the inputs $x = 0, y = 1, z = 0$ (third row in the table).

|  x  |  y  |  z  | $f(x, y, z)$ |
| :-: | :-: | :-: | :----------: |
|  0  |  0  |  0  |      0       |
|  0  |  0  |  1  |      0       |
|  0  |  1  |  0  |      1       |
|  0  |  1  |  1  |      0       |
|  1  |  0  |  0  |      1       |
|  1  |  0  |  1  |      0       |
|  1  |  1  |  0  |      1       |
|  1  |  1  |  1  |      0       |

_**Figure 1.1** Truth table representation of a Boolean function (example)._

Since $y$ is 1, it follows that $x + y = 1$ and thus $1 \cdot \bar 0 = 1 \cdot 1 = 1$. The complete verification of the equivalence between the expression and the truth table is achieved by evaluating the expression on each of the eight possible input combinations, verifying that it yields the same value listed in the table’s right column.

## Canonical Representation

As it turns out, every Boolean function can be expressed using at least one Boolean expression called the _canonical representation_. Starting with the function’s truth table, we focus on all the rows in which the function has value 1. For each such row, we construct a term created by And-ing together _literals_ (variables or their negations) that fix the values of all the row’s inputs. For example, let us focus on the third row in figure 1.1, where the function’s value is 1. Since the variable values in this row are $x = 0$, $y = 1$, $z = 0$, we construct the term $\bar x y \bar z$. Following the same procedure, we construct the terms $x \bar y \bar z$ and $xy \bar z$ for rows 5 and 7. Now, if we Or-together all these terms (for all the rows where the function has value 1), we get a Boolean expression that is equivalent to the given truth table. Thus the canonical representation of the Boolean function shown in figure 1.1 is $f(x, y, z) = \bar x y \bar z + x \bar y \bar z + xy \bar z$. This construction leads to an important conclusion: Every Boolean function, no matter how complex, can be expressed using three Boolean operators only: And, Or, and Not.

## Two-Input Boolean Functions

An inspection of figure 1.1 reveals that the number of Boolean functions that can be defined over $n$ binary variables is ${2^2}^n$. For example, the sixteen Boolean functions spanned by two variables are listed in figure 1.2. These functions were constructed systematically, by enumerating all the possible 4-wise combinations of binary values in the four right columns. Each function has a conventional name that seeks to describe its underlying operation.

| Function |  y  |  z  | $f(x, y, z)$ |
| :------: | :-: | :-: | :----------: |
|    0     |  0  |  0  |      0       |
|    0     |  0  |  1  |      0       |
|    0     |  1  |  0  |      1       |
|    0     |  1  |  1  |      0       |
|    1     |  0  |  0  |      1       |
|    1     |  0  |  1  |      0       |
|    1     |  1  |  0  |      1       |
|    1     |  1  |  1  |      0       |

_**Figure 1.2** All the Boolean functions of two variables_

Here are some examples: The name of the Nor function is shorthand for Not-Or: Take the Or of $x$ and $y$, then negate the result. The Xor function -- shorthand for "exclusive or" -- returns 1 when its two variables have opposing truth-values and 0 otherwise. Conversely, the Equivalence function returns 1 when the two variables have identical truth-values. The If-$x$-then-$y$ function (also known as $x \rightarrow y$, or "$x$ Implies $y$") returns 1 when $x$ is 0 or when both $x$ and $y$ are 1. The other functions are self-explanatory.

The Nand function (as well as the Nor function) has an interesting theoretical
property: Each one of the operations And, Or, and Not can be constructed from it,
and it alone (e.g., $x$ Or $y = (x$ Nand $x)$ Nand $(y$ Nand $y)$. And since every Boolean function can be constructed from And, Or, and Not operations using the canonical representation method, it follows that every Boolean function can be constructed from Nand operations alone. This result has far-reaching practical implications: Once we have in our disposal a physical device that implements Nand, we can use many copies of this device (wired in a certain way) to implement in hardware any Boolean function.

# Gate Logic

A _gate_ is a physical device that implements a Boolean function. If a Boolean function $f$ operates on $n$ variables and returns $m$ binary results (in all our examples so far, $m$ was 1), the gate that implements $f$ will have $n$ _input pins_ and $m$ _output pins_. When we put some values $v_1 ... v_n$ in the gate’s input pins, the gate’s ‘‘logic’’ -- its internal structure -- should compute and output $f(v_1 ... v_n)$. And just like complex Boolean functions can be expressed in terms of simpler functions, complex gates are composed from more elementary gates. The simplest gates of all are made from tiny switching devices, called _transistors_, wired in a certain topology designed to effect the overall gate functionality.

Although most digital computers today use electricity to represent and transmit
binary data from one gate to another, any alternative technology permitting switching and conducting capabilities can be employed. Indeed, during the last fifty years, researchers have built many hardware implementations of Boolean functions, including magnetic, optical, biological, hydraulic, and pneumatic mechanisms. Today, most gates are implemented as transistors etched in silicon, packaged as _chips_. In this course we use the words _chip_ and _gate_ interchangeably, tending to use the term _gates_ for simple chips.

The availability of alternative switching technology options, on the one hand, and the observation that Boolean algebra can be used to abstract the behavior of _any_ such technology, on the other, is extremely important. Basically, it implies that computer scientists don’t have to worry about physical things like electricity, circuits, switches, relays, and power supply. Instead, computer scientists can be content with the abstract notions of Boolean algebra and gate logic, trusting that someone else (the physicists and electrical engineers—bless their souls) will figure out how to actually realize them in hardware. Hence, a _primitive gate_ (see figure 1.3) can be viewed as a black box device that implements an elementary logical operation in one way or another—we don’t care how. A hardware designer starts from such primitive gates and designs more complicated functionality by interconnecting them, leading to the construction of _composite_ gates.

![Standard symbolic notation of some elementary logic gates.](/figures/figure1-3.svg 'Figure 1.3: Standard symbolic notation of some elementary logic gates.')
_**Figure 1.3** Standard symbolic notation of some elementary logic gates._

![Composite implementation of a three-way And gate. The rectangle on the right defines the conceptual boundaries of the gate interface.](/figures/figure1-4.svg 'Figure 1.4: Composite implementation of a three-way And gate. The rectangle on the right defines the conceptual boundaries of the gate interface.')
_**Figure 1.4** Composite implementation of a three-way And gate. The rectangle on the right defines the conceptual boundaries of the gate interface._

## Primitive and Composite Gates

Since all logic gates have the same input and output semantics (0’s and 1’s), they can be chained together, creating _composite gates_ of arbitrary complexity. For example, suppose we are asked to implement the 3-way Boolean function And($a, b, c$). Using Boolean algebra, we can begin by observing that $a \cdot b \cdot c = (a \cdot b) \cdot c$, or, using prefix notation, And($a, b, c$) $=$ And(And($a, b$), $c$). Next, we can use this result to construct the composite gate depicted in figure 1.4.

The construction described in figure 1.4 is a simple example of _gate logic_, also called _logic design_. Simply put, logic design is the art of interconnecting gates in order to implement more complex functionality, leading to the notion of _composite gates_. Since composite gates are themselves realizations of (possibly complex) Boolean functions, their "outside appearance" (e.g., left side of figure 1.4) looks just like that of primitive gates. At the same time, their internal structure can be rather complex.

We see that any given logic gate can be viewed from two different perspectives: external and internal. The right-hand side of figure 1.4 gives the gate’s internal architecture, or _implementation_, whereas the left side shows only the gate _interface_, namely, the input and output pins that it exposes to the outside world. The former is relevant only to the gate designer, whereas the latter is the right level of detail for other designers who wish to use the gate as an abstract off-the-shelf component, without paying attention to its internal structure.

Let us consider another logic design example—that of a Xor gate. As discussed before, Xor($a, b$) is 1 exactly when either $a$ is 1 and $b$ is 0, or when $a$ is 0 and $b$ is 1. Said otherwise, Xor($a, b$) $=$ Or(And($a$, Not($b$)), And(Not($a$), $b$)). This definition leads to the logic design shown in figure 1.5.

Note that the gate _interface_ is unique: There is only one way to describe it, and this is normally done using a truth table, a Boolean expression, or some verbal specification.

![Xor gate, along with a possible implementation.](/figures/figure1-5.svg 'Figure 1.5: Xor gate, along with a possible implementation.')
_**Figure 1.5** Xor gate, along with a possible implementation._

This interface, however, can be realized using many different _implementations_, some of which will be better than others in terms of cost, speed, and simplicity. For example, the Xor function can be implemented using four, rather than five, And, Or, and Not gates. Thus, from a functional standpoint, the fundamental requirement of logic design is that _the gate implementation will realize its stated interface, in one way or another_. From an efficiency standpoint, the general rule is to try to _do more with less_, that is, use as few gates as possible.

To sum up, the art of logic design can be described as follows: Given a gate specification (interface), find an efficient way to implement it using other gates that were already implemented. This, in a nutshell, is what we will do in the rest of this chapter

# Actual Hardware Construction

Having described the logic of composing complex gates from simpler ones, we are now in a position to discuss how gates are actually built. Let us start with an intentionally naïve example.

Suppose we open a chip fabrication shop in our home garage. Our first contract is to build a hundred Xor gates. Using the order’s downpayment, we purchase a soldering gun, a roll of copper wire, and three bins labeled "And gates," "Or gates," and "Not gates," each containing many identical copies of these elementary logic gates. Each of these gates is sealed in a plastic casing that exposes some input and output pins, as well as a power supply plug. To get started, we pin figure 1.5 to our garage wall and proceed to realize it using our hardware. First, we take two And gates, two Not gates, and one Or gate, and mount them on a board according to the figure’s layout. Next, we connect the chips to one another by running copper wires among them and by soldering the wire ends to the respective input/output pins. Now, if we follow the gate diagram carefully, we will end up having three exposed wire ends. We then solder a pin to each one of these wire ends, seal the entire device (except for the three pins) in a plastic casing, and label it ‘‘Xor.’’ We can repeat this assembly process many times over. At the end of the day, we can store all the chips that we’ve built in a new bin and label it ‘‘Xor gates.’’ If we (or other people) are asked to construct some other chips in the future, we’ll be able to use these Xor gates as elementary building blocks, just as we used the And, Or, and Not gates before.

As the reader has probably sensed, the garage approach to chip production leaves much to be desired. For starters, there is no guarantee that the given chip diagram is correct. Although we can prove correctness in simple cases like Xor, we cannot do so in many realistically complex chips. Thus, we must settle for empirical testing: Build the chip, connect it to a power supply, activate and deactivate the input pins in various configurations, and hope that the chip outputs will agree with its specifications. If the chip fails to deliver the desired outputs, we will have to tinker with its physical structure—a rather messy affair. Further, even if we will come up with the right design, replicating the chip assembly process many times over will be a time-consuming and error-prone affair. There must be a better way!

# Hardware Description Language (HDL)

Today, hardware designers no longer build anything with their bare hands. Instead, they plan and optimize the chip architecture on a computer workstation, using structured modeling formalisms like _Hardware Description Language_, or HDL (also known as VHDL, where V stands for _Virtual_). The designer specifies the chip structure by writing an HDL program, which is then subjected to a rigorous battery of tests. These tests are carried out virtually, using computer simulation: A special software tool, called a _hardware simulator_, takes the HDL program as input and builds an image of the modeled chip in memory. Next, the designer can instruct the simulator to test the virtual chip on various sets of inputs, generating simulated chip outputs. The outputs can then be compared to the desired results, as mandated by the client who ordered the chip built.

In addition to testing the chip’s correctness, the hardware designer will typically be interested in a variety of parameters such as speed of computation, energy consumption, and the overall cost implied by the chip design. All these parameters can be simulated and quantified by the hardware simulator, helping the designer optimize the design until the simulated chip delivers desired cost/performance levels.

Thus, using HDL, one can completely plan, debug, and optimize the entire chip before a single penny is spent on actual production. When the HDL program is deemed complete, that is, when the performance of the simulated chip satisfies the client who ordered it, the HDL program can become the blueprint from which many copies of the physical chip can be stamped in silicon. This final step in the chip
life cycle - from an optimized HDL program to mass production - is typically outsourced to companies that specialize in chip fabrication, using one switching technology or another.

## Example: Building a Xor Gate

As we have seen in figures 1.2 and 1.5, one way to define _exclusive_ or is Xor($a,b$)=Or(And($a$, Not($b$)), And(Not($a$),$b$)). This logic can be expressed either graphically, as a gate diagram, or textually, as an HDL program. The latter program is written in the HDL variant used throughout this course. See figure 1.6 for the details.

{% EmbeddedHardwareIDE id="nnDG6JRQjL0aNVb7AJHnmZrv02pHIINF" /%}

## Explanation

An HDL definition of a chip consists of a _header_ section and a _parts_ section. The header section specifies the chip _interface_, namely the chip name and the names of its input and output pins. The parts section describes the names and topology of all the lower-level parts (other chips) from which this chip is constructed. Each part is represented by a _statement_ that specifies the part name and the way it is connected to other parts in the design. Note that in order to write such statements legibly, the HDL programmer must have a complete documentation of the underlying parts’ _interfaces_. For example, figure 1.6 assumes that the input and output pins of the Not gate are labeled in and out, and those of And and Or are labeled a, b and out. This API-type information is not obvious, and one must have access to it before one can plug the chip parts into the present code

Inter-part connections are described by creating and connecting _internal pins_, as needed. For example, consider the bottom of the gate diagram, where the output of a Not gate is piped into the input of a subsequent And gate. The HDL code describes this connection by the pair of statements `Not(...,out=nota)` and `And(a=nota,...)`. The first statement creates an internal pin (outbound wire) named `nota`, feeding out into it. The second statement feeds the value of `nota` into the a input of an And gate. Note that pins may have an unlimited fan out. For example, in figure 1.6, each input is simultaneously fed into two gates. In gate diagrams, multiple connections are described using forks. In HDL, the existence of forks is implied by the code.

## Testing

Rigorous quality assurance mandates that chips be tested in a specific, replicable, and well-documented fashion. With that in mind, hardware simulators are usually designed to run _test scripts_, written in some scripting language. For example, the test script in figure 1.6 is written in the scripting language understood by the embedded hardware simulator.

Let us give a brief description of the test script from figure 1.6. The first two lines of the test script instruct the simulator to load the `Xor.hdl` program and get ready to print the values of selected variables. Next, the script lists a series of testing scenarios, designed to simulate the various contingencies under which the Xor chip will have to operate in "real-life" situations. In each scenario, the script instructs the simulator to bind the chip inputs to certain data values, compute the resulting output, and record the test results in a designated output file. In the case of simple gates like Xor, one can write an exhaustive test script that enumerates all the possible input values of the gate. The resulting output file (right side of figure 1.6) can then be viewed as a complete empirical proof that the chip is well designed. The luxury of such certitude is not feasible in more complex chips, as we will see later.

# Hardware Simulation

Since HDL is a hardware construction language, the process of writing and debugging HDL programs is quite similar to software development. The main difference is that instead of writing code in a language like Java, we write it in HDL, and instead of using a compiler to translate and test the code, we use a hardware simulator. The hardware simulator is a computer program that knows how to parse and interpret HDL code, turn it into an executable representation, and test it according to the specifications of a given test script. There exist many commercial hardware simulators on the market, and these vary greatly in terms of cost, complexity, and ease of use. This website provides a simple (and free) hardware simulator that is sufficiently powerful to support sophisticated hardware design projects. In particular, the simulator provides all the necessary tools for building, testing, and integrating all the chips presented in the course, leading to the construction of a general-purpose computer. Figure 1.7 illustrates a typical chip simulation session.
