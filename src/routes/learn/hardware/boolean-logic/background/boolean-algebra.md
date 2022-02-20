### Boolean Algebra

Boolean algebra deals with Boolean (also called binary) values that are typically labeled true/false, 1/0, yes/no, on/off, and so forth. We will use 1 and 0. A Boolean function is a function that operates on binary inputs and returns binary outputs. Since computer hardware is based on the representation and manipulation of binary values, Boolean functions play a central role in the specification, construction, and optimization of hardware architectures. Hence, the ability to formulate and analyze Boolean functions is the first step toward constructing computer architectures.

#### Truth Table Representation

The simplest way to specify a Boolean function is to enumerate all the possible values of the functions input variables, along with the functions output for each set of inputs. This is called the _truth table_ representation of the function, illustrated in figure 1.1.

The first three columns of figure 1.1 enumerate all the possible binary values of the functions variables. For each one of the $2^n$ possible tuples $v_1 ... v_n$ (here $n = 3$), the last column gives the value of $f(v_1 ... v_n)$.

#### Boolean Expressions

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

#### Canonical Representation

As it turns out, every Boolean function can be expressed using at least one Boolean expression called the _canonical representation_. Starting with the function’s truth table, we focus on all the rows in which the function has value 1. For each such row, we construct a term created by And-ing together _literals_ (variables or their negations) that fix the values of all the row’s inputs. For example, let us focus on the third row in figure 1.1, where the function’s value is 1. Since the variable values in this row are $x = 0$, $y = 1$, $z = 0$, we construct the term $\bar x y \bar z$. Following the same procedure, we construct the terms $x \bar y \bar z$ and $xy \bar z$ for rows 5 and 7. Now, if we Or-together all these terms (for all the rows where the function has value 1), we get a Boolean expression that is equivalent to the given truth table. Thus the canonical representation of the Boolean function shown in figure 1.1 is $f(x, y, z) = \bar x y \bar z + x \bar y \bar z + xy \bar z$. This construction leads to an important conclusion: Every Boolean function, no matter how complex, can be expressed using three Boolean operators only: And, Or, and Not.

#### Two-Input Boolean Functions

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
