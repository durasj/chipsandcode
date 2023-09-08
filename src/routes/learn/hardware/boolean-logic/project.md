---
title: Project
updated: 2023-09-06
---

# Description

We now turn to outlining the first stage of this bottom-up hardware construction project, one gate at a time.
This project specifies a typical set of gates, each designed to carry out a common Boolean operation.
These gates will be used in the chapters that follow to construct the full architecture of a typical modern computer.

# Objective

Implement all the logic gates presented in the chapter. The only building
blocks that you can use are primitive `Nand` gates and the composite gates that you
will gradually build on top of them.
You know your implementation is correct if all Tests pass.

All the gates can be built and simulated here, using the embedded hardware simulator.
Our implementation guidelines are intentionally partial, since we want you to discover the actual gate architectures yourself.
We reiterate that each gate can be implemented in more than one way; the simpler the implementation, the better.

# The Nand Gate

Similar to the role of axioms in mathematics, primitive gates provide a set of elementary building blocks from which everything else can be built.
Operationally, primitive gates have an "off-the-shelf" implementation that is supplied externally.
Thus, they can be used in the construction of other gates and chips without worrying about their internal design.
In the computer architecture that we are now beginning to build, we have chosen to base all the hardware on one primitive gate only: `Nand`.
This gate is considered primitive and thus there is no need to implement it.

The `Nand` gate is designed to compute the following Boolean function:

|  a  |  b  | Nand($a$, $b$) |
| :-: | :-: | :------------: |
|  0  |  0  |       1        |
|  0  |  1  |       1        |
|  1  |  0  |       1        |
|  1  |  1  |       0        |

{% EmbeddedHardwareIDE id="BuiltinNand" /%}
_**Simulator 1.2** `Nand` gate using the built-in implementation._

# Basic Logic Gates

Some of the logic gates presented here are typically referred to as "elementary" or
"basic". At the same time, every one of them can be composed from `Nand` gates
alone. Therefore, they need not be viewed as primitive.

## Not

The single-input `Not` gate, also known as "converter", converts its input from
0 to 1 and vice versa.
The implementation of a unary `Not` gate from a binary `Nand` gate is simple.

{% EmbeddedHardwareIDE id="ExerciseNot" celebrate="true" /%}
_**Simulator 1.3** `Not` gate with missing implementation._

## And

The `And` function returns 1 when both its inputs are 1, and 0 otherwise.
Once again, the gate implementation is simple.

{% EmbeddedHardwareIDE id="ExerciseAnd" celebrate="true" /%}
_**Simulator 1.4** `And` gate with missing implementation._

## Or

The `Or` function returns 1 when at least one of its inputs is 1, and 0 otherwise.
This function can be defined in terms of some of the Boolean functions implemented previously, using some simple Boolean manipulations.
Thus, the respective gate can be built using previously built gates.

{% EmbeddedHardwareIDE id="ExerciseOr" celebrate="true" /%}
_**Simulator 1.5** `Or` gate with missing implementation._

## Xor

The `Xor` function, also known as "exclusive or", returns 1 when its two inputs
have opposing values, and 0 otherwise.
Likewise, this gate can be built using previously built gates.

{% EmbeddedHardwareIDE id="ExerciseXor" celebrate="true" /%}
_**Simulator 1.6** `Xor` gate with missing implementation._

## Multiplexor

A multiplexor (Figure 1.6) is a three-input gate that uses one of the inputs, called "selection bit", to select and output one of the other two inputs, called "data bits".
Thus, a better name for this device might have been _selector_.
The name _multiplexor_ was adopted from communications systems, where similar devices are used to serialize (multiplex) several input signals over a single output wire.
As usual, this gate can be built using previously built gates.

{% LayoutRow .gap-4 %}
{% LayoutCol .flex-1 %}
| a | b | sel | out |
| :-: | :-: | :-: | :-: |
| 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 0 |
| 1 | 0 | 0 | 1 |
| 1 | 1 | 0 | 1 |
| 0 | 0 | 1 | 0 |
| 0 | 1 | 1 | 1 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 1 | 1 |
{% /LayoutCol %}

{% LayoutCol .flex-1 %}
| sel | out |
| :-: | :-: |
| 0 | a |
| 1 | b |

![Multiplexor. The second truth table is an abbreviated version of the first truth table.](/figures/figure1-6.svg 'Figure 1.6: Multiplexor. The second truth table is an abbreviated version of the first truth table.')
{% /LayoutCol %}
{% /LayoutRow %}
_**Figure 1.6** Multiplexor. The second truth table is an abbreviated version of the first truth table._

{% EmbeddedHardwareIDE id="ExerciseMux" celebrate="true" /%}
_**Simulator 1.7** `Mux` gate with missing implementation._

## Demultiplexor

A demultiplexor (Figure 1.7) performs the opposite function of a multiplexor: It takes a single input and channels it to one of two possible outputs according to a selector bit that specifies which output to chose.
You know the drill: This gate can be built using previously built gates.

{% LayoutRow .gap-4 %}
{% LayoutCol .flex-1 %}
| sel | a | b |
| :-: | :-: | :-: |
| 0 | in | 0 |
| 1 | 0 | in |
{% /LayoutCol %}

{% LayoutCol .flex-1 %}
![Demultiplexor.](/figures/figure1-7.svg 'Figure 1.7: Demultiplexor.')
{% /LayoutCol %}
{% /LayoutRow %}
_**Figure 1.7** Demultiplexor._

{% EmbeddedHardwareIDE id="ExerciseDMux" celebrate="true" /%}
_**Simulator 1.8** `DMux` gate with missing implementation._

# Multi-Bit Versions of Basic Gates

Computer hardware is typically designed to operate on multi-bit arrays called "buses".
For example, a basic requirement of a 32-bit computer is to be able to compute (bit-wise) an And function on two given 32-bit buses.
To implement this operation, we can build an array of 32 binary And gates, each operating separately on a pair of bits.
In order to enclose all this logic in one package, we can encapsulate the gates array in a single chip interface consisting of two 32-bit input buses and one 32-bit output bus.

This section describes a typical set of such multi-bit logic gates, as needed for the construction of a typical 16-bit computer.
We note in passing that the architecture of $n$-bit logic gates is basically the same irrespective of $n$’s value.

When referring to individual bits in a bus, it is common to use an array syntax.
For example, to refer to individual bits in a 16-bit bus named $data$, we use the notation `data[0]`, `data[1]`,..., `data[15]`.

## Multi-Bit Not

An $n$-bit `Not` gate applies the Boolean operation `Not` to every one of the bits in its $n$-bit input bus.

## Multi-Bit And

An $n$-bit `And` gate applies the Boolean operation `And` to every one of the $n$ bit-pairs arrayed in its two $n$-bit input buses.

## Multi-Bit Or

An $n$-bit `Or` gate applies the Boolean operation `Or` to every one of the $n$ bit-pairs arrayed in its two $n$-bit input buses.

## Multi-Bit Multiplexor

An $n$-bit multiplexor is exactly the same as the binary multiplexor described in Figure 1.6, except that the two inputs are each $n$-bit wide; the selector is a single bit.

# Multi-Way Versions of Basic Gates

Many 2-way logic gates that accept two inputs have natural generalization to multiway variants that accept an arbitrary number of inputs.
This section describes a set of multi-way gates that will be used subsequently in various chips in our computer architecture.
Similar generalizations can be developed for other architectures, as needed.

## Multi-Way Or

An $n$-way `Or` gate outputs 1 when at least one of its $n$ bit inputs is 1, and 0 otherwise.

## Multi-Way/Multi-Bit Multiplexor

An $m$-way $n$-bit multiplexor selects one of $m$ $n$-bit input buses and outputs it to a single $n$-bit output bus. The selection is specified by a set of $k$ control bits, where $k = log_2m$. Figure 1.8 depicts a typical example.

The computer platform that we develop in this course requires two variations of this chip: A 4-way 16-bit multiplexor and an 8-way 16-bit multiplexor.

{% LayoutRow .gap-4 %}
{% LayoutCol .flex-1 %}
| sel[1] | sel[0] | out |
| :----: | :----: | :-: |
| 0 | 0 | a |
| 0 | 1 | b |
| 1 | 0 | c |
| 1 | 1 | d |
{% /LayoutCol %}

{% LayoutCol .flex-1 %}
![4-way multiplexor. The width of the input and output buses may vary.](/figures/figure1-8.svg 'Figure 1.8: 4-way multiplexor. The width of the input and output buses may vary.')
{% /LayoutCol %}
{% /LayoutRow %}
_**Figure 1.8** 4-way multiplexor. The width of the input and output buses may vary._

## Multi-Way/Multi-Bit Demultiplexor

An $m$-way $n$-bit demultiplexor (Figure 1.9) channels a single $n$-bit input into one of $m$ possible $n$-bit outputs. The selection is specified by a set of $k$ control bits, where $k = log_2m$.

The specific computer platform that we will build requires two variations of this chip: A 4-way 1-bit demultiplexor and an 8-way 1-bit multiplexor, as follows.

{% LayoutRow .gap-4 %}
{% LayoutCol .flex-1 %}
| sel[1] | sel[0] | a | b | c | d |
| :----: | :----: | :-: | :-: | :-: | :-: |
| 0 | 0 | in | 0 | 0 | 0 |
| 0 | 1 | 0 | in | 0 | 0 |
| 1 | 0 | 0 | 0 | in | 0 |
| 1 | 1 | 0 | 0 | 0 | in |
{% /LayoutCol %}

{% LayoutCol .flex-1 %}
![4-way demultiplexor.](/figures/figure1-9.svg 'Figure 1.9: 4-way demultiplexor.')
{% /LayoutCol %}
{% /LayoutRow %}
_**Figure 1.9** 4-way demultiplexor._

# Perspective

This chapter described the first steps taken in an applied digital design project. In the next chapter we will build more complicated functionality using the gates built here.

Although we have chosen to use Nand as our basic building block, other approaches are possible.
For example, one can build a complete computer platform using `Nor` gates alone, or, alternatively, a combination of `And`, `Or`, and `Not` gates.
These constructive approaches to logic design are theoretically equivalent, just as all theorems in geometry can be founded on different sets of axioms as alternative points of departure.
The theory and practice of such constructions are covered in standard textbooks about digital design or logic design.

Throughout the chapter, we paid no attention to efficiency considerations such as the number of elementary gates used in constructing a composite gate or the number of wire crossovers implied by the design.
Such considerations are critically important in practice, and a great deal of computer science and electrical engineering expertise focuses on optimizing them.
Another issue we did not address at all is the physical implementation of gates and chips using the laws of physics, for example, the role of transistors embedded in silicon.
There are of course several such implementation options, each having its own characteristics (speed, power requirements, production cost, etc.).
Any nontrivial coverage of these issues requires some background in electronics and physics.
