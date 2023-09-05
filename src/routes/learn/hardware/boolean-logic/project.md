---
title: Project
updated: 2023-09-06
---

# Specification

This section specifies a typical set of gates, each designed to carry out a common
Boolean operation. These gates will be used in the chapters that follow to construct
the full architecture of a typical modern computer. Our starting point is a single
primitive Nand gate, from which all other gates will be derived recursively. Note that
we provide only the gates’ specifications, or interfaces, delaying implementation
details until a subsequent section. Readers who wish to construct the specified gates
in HDL are encouraged to do so, referring to appendix A as needed. All the gates
can be built and simulated on a personal computer, using the hardware simulator
supplied with the book.

## The Nand Gate

The starting point of our computer architecture is the Nand gate, from which all
other gates and chips are built. The Nand gate is designed to compute the following
Boolean function:

|  a  |  b  | $Nand(a, b)$ |
| :-: | :-: | :----------: |
|  0  |  0  |      1       |
|  0  |  1  |      1       |
|  1  |  0  |      1       |
|  1  |  1  |      0       |

Throughout the book, we use "chip API boxes" to specify chips. For each chip, the
API specifies the chip name, the names of its input and output pins, the function or
operation that the chip effects, and an optional comment.

## Basic Logic Gates

Some of the logic gates presented here are typically referred to as "elementary" or
"basic". At the same time, every one of them can be composed from Nand gates
alone. Therefore, they need not be viewed as primitive.

### Not

The single-input Not gate, also known as "converter", converts its input from
0 to 1 and vice versa.

### And

The And function returns 1 when both its inputs are 1, and 0 otherwise.

### Or

The Or function returns 1 when at least one of its inputs is 1, and 0 otherwise.

### Xor

The Xor function, also known as "exclusive or", returns 1 when its two inputs
have opposing values, and 0 otherwise.

### Multiplexor

A multiplexor (figure 1.8) is a three-input gate that uses one of the
inputs, called "selection bit", to select and output one of the other two inputs, called "data bits". Thus, a better name for this device might have been $selector$. The
name $multiplexor$ was adopted from communications systems, where similar
devices are used to serialize (multiplex) several input signals over a single output
wire.

|  a  |  b  | sel | out |
| :-: | :-: | :-: | :-: |
|  0  |  0  |  0  |  0  |
|  0  |  1  |  0  |  0  |
|  1  |  0  |  0  |  1  |
|  1  |  1  |  0  |  1  |
|  0  |  0  |  1  |  0  |
|  0  |  1  |  1  |  1  |
|  1  |  0  |  1  |  0  |
|  1  |  1  |  1  |  1  |

| sel | out |
| :-: | :-: |
|  0  |  a  |
|  1  |  b  |

![Multiplexor. The table at the top right is an abbreviated version of the truth table on the left.](/figures/figure1-6.svg 'Figure 1.6: Multiplexor. The table at the top right is an abbreviated version of the truth table on the left.')
_**Figure 1.6** Multiplexor. The table at the top right is an abbreviated version of the truth table on the left._

| sel |  a  |  b  |
| :-: | :-: | :-: |
|  0  | in  |  0  |
|  1  |  0  | in  |

![Demultiplexor.](/figures/figure1-7.svg 'Figure 1.7: Demultiplexor.')
_**Figure 1.7** Demultiplexor._

### Demultiplexor

A demultiplexor (figure 1.9) performs the opposite function of a
multiplexor: It takes a single input and channels it to one of two possible outputs
according to a selector bit that specifies which output to chose.

## Multi-Bit Versions of Basic Gates

Computer hardware is typically designed to operate on multi-bit arrays called
"buses". For example, a basic requirement of a 32-bit computer is to be able to
compute (bit-wise) an And function on two given 32-bit buses. To implement this
operation, we can build an array of 32 binary And gates, each operating separately on a pair of bits. In order to enclose all this logic in one package, we can encapsulate
the gates array in a single chip interface consisting of two 32-bit input buses and one
32-bit output bus.

This section describes a typical set of such multi-bit logic gates, as needed for the
construction of a typical 16-bit computer. We note in passing that the architecture of
$n$-bit logic gates is basically the same irrespective of $n$’s value.

When referring to individual bits in a bus, it is common to use an array syntax.
For example, to refer to individual bits in a 16-bit bus named $data$, we use the notation $data[0], data[1],..., data[15]$.

### Multi-Bit Not

An $n$-bit Not gate applies the Boolean operation Not to every one of
the bits in its $n$-bit input bus.

### Multi-Bit And

An $n$-bit And gate applies the Boolean operation And to every one
of the $n$ bit-pairs arrayed in its two $n$-bit input buses.

### Multi-Bit Or

An $n$-bit Or gate applies the Boolean operation Or to every one of the
$n$ bit-pairs arrayed in its two $n$-bit input buses.

### Multi-Bit Multiplexor

An $n$-bit multiplexor is exactly the same as the binary multiplexor described in figure 1.8, except that the two inputs are each $n$-bit wide; the
selector is a single bit.

## Multi-Way Versions of Basic Gates

Many 2-way logic gates that accept two inputs have natural generalization to multiway variants that accept an arbitrary number of inputs. This section describes a set
of multi-way gates that will be used subsequently in various chips in our computer
architecture. Similar generalizations can be developed for other architectures, as
needed.

### Multi-Way Or

An $n$-way Or gate outputs 1 when at least one of its $n$ bit inputs is 1,
and 0 otherwise.

### Multi-Way/Multi-Bit Multiplexor

An $m$-way $n$-bit multiplexor selects one of $m$ $n$-bit input buses and outputs it to a single $n$-bit output bus. The selection is specified by a set of $k$ control bits, where $k = log_2m$. Figure 1.10 depicts a typical example.

The computer platform that we develop in this book requires two variations of this
chip: A 4-way 16-bit multiplexor and an 8-way 16-bit multiplexor:

| sel[1] | sel[0] | out |
| :----: | :----: | :-: |
|   0    |   0    |  a  |
|   0    |   1    |  b  |
|   1    |   0    |  c  |
|   1    |   1    |  d  |

![4-way multiplexor. The width of the input and output buses may vary.](/figures/figure1-8.svg 'Figure 1.8: 4-way multiplexor. The width of the input and output buses may vary.')
_**Figure 1.8** 4-way multiplexor. The width of the input and output buses may vary._

### Multi-Way/Multi-Bit Demultiplexor

An $m$-way $n$-bit demultiplexor (figure 1.11)
channels a single $n$-bit input into one of $m$ possible $n$-bit outputs. The selection is specified by a set of $k$ control bits, where $k = log_2m$.

The specific computer platform that we will build requires two variations of this chip: A 4-way 1-bit demultiplexor and an 8-way 1-bit multiplexor, as follows.

| sel[1] | sel[0] |  a  |  b  |  c  |  d  |
| :----: | :----: | :-: | :-: | :-: | :-: |
|   0    |   0    | in  |  0  |  0  |  0  |
|   0    |   1    |  0  | in  |  0  |  0  |
|   1    |   0    |  0  |  0  | in  |  0  |
|   1    |   1    |  0  |  0  |  0  | in  |

![4-way demultiplexor.](/figures/figure1-9.svg 'Figure 1.9: 4-way demultiplexor.')
_**Figure 1.9** 4-way demultiplexor._
