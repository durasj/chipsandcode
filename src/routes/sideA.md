> Such simple things, And we make of them something so complex it defeats us, Almost.

-- John Ashbery (b. 1927), American poet

Every digital device — be it a personal computer, a cellular telephone, or a network router — is based on a set of chips designed to store and process information. Although these chips come in different shapes and forms, they are all made from the same building blocks: Elementary _logic gates_. The gates can be physically implemented in many different materials and fabrication technologies, but their logical behavior is consistent across all computers.

This exercise focuses on the construction of a family of simple chips called _Boolean gates_. Since Boolean gates are physical implementations of _Boolean functions_, we start with a brief treatment of Boolean algebra. We then show how Boolean gates implementing simple Boolean functions can be interconnected to deliver the functionality of more complex chips and create several chips ourselves.

# Boolean Algebra

Boolean algebra deals with Boolean (also called binary) values that are typically labeled true/false, 1/0, yes/no, on/off, and so forth. We will use 1 and 0. A Boolean function is a function that operates on binary inputs and returns binary outputs. Since computer hardware is based on the representation and manipulation of binary values, Boolean functions play a central role in the specification, construction, and optimization of hardware architectures.

The simplest way to specify a Boolean function is to enumerate all the possible values of the functions input variables, along with the functions output for each set of inputs. This is called the _truth table_ representation of the function, illustrated in Figure 1.1. The first two columns of Figure 1.1 enumerate all the possible binary inputs of the function and the last respective output from the boolean function.

|  x  |  y  | $f(x, y)$ |
| :-: | :-: | :-------: |
|  0  |  0  |     0     |
|  0  |  1  |     0     |
|  1  |  0  |     0     |
|  1  |  1  |     1     |

_**Figure 1.1** Truth table representation of boolean function And._

The Boolean function we see in Figure 1.1 is called _And_. This boolean function outputs $1$ only and only if both inputs are $1$, otherwise, it outputs $0$.

# Gate Logic

A _gate_ is a physical device that implements a Boolean function. If a Boolean function And operates on variables $x$ and $y$ and returns some result, the gate that implements And will have _input pins_ $x$ and $y$ and _output pin_ $out$. When we put some values on the gate’s input pins, the gate’s "logic" - its internal structure - should compute and output $f(x, y)$.

Today, most gates are implemented as transistors etched in silicon, packaged as _chips_. The simplest gates of all are made from tiny switching devices, called _transistors_. In this exercise we use the words _chip_ and _gate_ interchangeably. A hardware designer starts from primitive gates like the mentioned And and designs more complicated functionality by interconnecting them, leading to the construction of _composite_ gates.

![Standard symbolic notation of some elementary logic gates.](/figures/figure1-3.svg 'Figure 1.2: Standard symbolic notation of some elementary logic gates.')
_**Figure 1.2** Standard symbolic notation of some elementary logic gates._

![Composite implementation of a three-way And gate. The rectangle on the right defines the conceptual boundaries of the gate interface.](/figures/figure1-4.svg 'Figure 1.3: Composite implementation of a three-way And gate. The rectangle on the right defines the conceptual boundaries of the gate interface.')
_**Figure 1.3** Composite implementation of a three-way And gate. The rectangle on the right defines the conceptual boundaries of the gate interface._

To sum up, the art of logic design can be described as follows: Given a gate specification (interface), find an efficient way to implement it using other gates that were already implemented. This, in a nutshell, is what we will do in the rest of this exercise.

# Hardware Description Language (HDL)

Today, hardware designers no longer build anything with their bare hands. Instead, they plan and optimize the chip architecture on a computer workstation, using structured modeling formalisms like _Hardware Description Language_, or HDL (also known as VHDL, where V stands for _Virtual_). The designer specifies the chip structure by writing an HDL program, which is then subjected to a rigorous battery of tests. These tests are carried out virtually, using computer simulation: A special software tool, called a _hardware simulator_ is used to test the virtual chip on various sets of inputs, generating simulated chip outputs. The outputs can then be compared to the desired results.

# Examples

We will be implementing chips in the embedded hardware simulator. Check the video below to learn how to navigate the interface.

<!-- TODO: Video how to work with hardware simulator containing three-way And -->

## Gate: Three-way And

Let us consider a three-way And as can be seen in Figure 1.3. Its output is $1$ if and only if all three inputs are 1, otherwise, it is $0$. This logic can be expressed either graphically, as a gate diagram, or textually, as an HDL program. Below we can see the embedded hardware simulator with the ThreeWayAnd preloaded. You can see the expected and the actual truth table on the tab Output and checks on the tab Tests. Feel free to play around with it.

<!-- Three-way And -->

{% EmbeddedHardwareIDE id="zJPaqknoyQJdvOvfo8hInjHhWBAuzXZE" /%}

## Gate: Nand

Now, let us consider a Boolean function called _Nand_. Being an opposite to _And_, its output is $1$ if and only if both of its inputs are $0$, otherwise, it is $1$. We can see both the interface and the implementation in Figure 1.4. However, the HDL is missing. It is your turn to implement it - good luck! You are done when all Tests are passing.

<!-- Figure 1.4 Nand -->

<!-- Nand -->

{% EmbeddedHardwareIDE id="23dyaQzWOLuUeJbLozhnzzs8A64tBkc8" /%}

## Gate: Nor

Analogously, a Boolean function called _Nor_ is an opposite to _Or_. Its output is $1$ if and only if both of its inputs are $0$, otherwise, it is $1$. We can see both the interface in Figure 1.5. This time, the implementation diagram is missing to make it harder for you. Do you know what gates to use? You are done when all Tests are passing.

<!-- Figure 1.5 Nor -->

<!-- Nor -->

{% EmbeddedHardwareIDE id="xqKdROsftOA6WwMZtXNoW4L0Q0Y9x-1W" /%}

## Gate: Three-way Or

You are getting the hang of it! The next gate is a three-way Or, similar to the three-way And we mentioned before. This Boolean function outputs $1$ if any of its three inputs are $1$. If none of its inputs are $1$, it outputs $0$. As usual, you are done when all Tests are passing.

<!-- Three-way Or -->

{% EmbeddedHardwareIDE id="iFz2lLJM35-c3hzwKemsHQ7xY0aCyqXS" /%}

## Gate: Xor

Let us increase the difficulty a bit. The next one is called _Xor_. Its output is $1$ if and only if one of its inputs is $1$. If both are $1$ or $0$, it is $0$. This one can be challenging! Feel free to use a pen and paper to draw a possible implementation before writing the HDL if you want. As usual, you are done when all Tests are passing.

<!-- Xor -->

{% EmbeddedHardwareIDE id="Y596SRnnhQZU4XQj-k-C4o-MHvSAJVPO" /%}
