---
title: Logic, composition, and HDL
updated: 2026-11-03
---

A truth table, a Boolean expression, a gate diagram, and an HDL definition can describe the same behavior. This explanation connects those views, from one signal to a circuit you can test.

# Signals and Boolean operations

A **Boolean value** has two possible states. We write them as 0 and 1; other contexts use false and true. A Boolean function accepts these values and produces one or more Boolean results.

Start with three operations:

| Operation | Rule                                       |
| --------- | ------------------------------------------ |
| NOT a     | 1 when a is 0; 0 when a is 1               |
| a AND b   | 1 only when both inputs are 1              |
| a OR b    | 1 when either input, or both inputs, are 1 |

OR is inclusive. **XOR**, or exclusive OR, is 1 when the inputs differ. **NAND** means NOT AND: compute AND and invert the result. **NOR** similarly inverts OR.

In algebra, AND is often written as multiplication, OR as a plus sign, and NOT as a bar over a variable. These symbols describe Boolean operations, not ordinary arithmetic: in Boolean algebra, 1 OR 1 is 1.

# Truth tables

A truth table records the output for every input combination. With n independent binary inputs there are **2ⁿ rows**. Two inputs give four rows; three give eight.

Consider this rule: “a or b is on, and c is off.”

```text
f(a, b, c) = (a OR b) AND NOT c
```

| a   | b   | c   | f   |
| --- | --- | --- | --- |
| 0   | 0   | 0   | 0   |
| 0   | 0   | 1   | 0   |
| 0   | 1   | 0   | 1   |
| 0   | 1   | 1   | 0   |
| 1   | 0   | 0   | 1   |
| 1   | 0   | 1   | 0   |
| 1   | 1   | 0   | 1   |
| 1   | 1   | 1   | 0   |

For a=0, b=1, c=0, the OR gives 1 and NOT c gives 1. AND combines those into 1. Evaluating all eight rows establishes that the expression and table agree for every possible input in this model.

# Canonical representation

There is a direct recipe for turning any truth table into an expression using AND, OR, and NOT.

1. Find each row whose output is 1.
2. Make an AND term that matches that row exactly. Use the variable for a 1 and its NOT for a 0.
3. OR all those terms together.

A variable or its negation is called a **literal**. For the row a=0, b=1, c=0, the matching term is `NOT a AND b AND NOT c`. It is 1 for that row and 0 for every other row.

The example above has three rows with output 1, so its canonical **sum of products** is:

```text
f = (NOT a AND b AND NOT c)
 OR (a AND NOT b AND NOT c)
 OR (a AND b AND NOT c)
```

“Product” means AND; “sum” means OR. The long expression and `(a OR b) AND NOT c` have identical truth tables. Canonical form guarantees a construction, but it is not usually the shortest construction.

If there are no rows with output 1, the function is the constant 0. If every row outputs 1, it is the constant 1. Constants can also be constructed, for example `a AND NOT a` and `a OR NOT a`.

[Change the rows and generate a canonical expression](/tools/boolean-functions).

# All two-input functions

A two-input table has four output positions. Each can independently be 0 or 1, giving **2⁴ = 16 functions**. For a single binary output, n inputs give **2^(2ⁿ)** Boolean functions.

Here is the complete set. The four output digits correspond to inputs **00, 01, 10, 11**, in that order.

| Outputs | Function                |
| ------- | ----------------------- |
| 0000    | Constant 0              |
| 0001    | a AND b                 |
| 0010    | a AND NOT b             |
| 0011    | a                       |
| 0100    | NOT a AND b             |
| 0101    | b                       |
| 0110    | a XOR b                 |
| 0111    | a OR b                  |
| 1000    | a NOR b                 |
| 1001    | Equivalence: a equals b |
| 1010    | NOT b                   |
| 1011    | b implies a             |
| 1100    | NOT a                   |
| 1101    | a implies b             |
| 1110    | a NAND b                |
| 1111    | Constant 1              |

Logical implication `a implies b` is false only when a is 1 and b is 0. It describes a truth-table relation, not an instruction that causes b to change.

The [Boolean functions tool](/tools/boolean-functions) lets you edit every output row, evaluate inputs, and compare the result with its canonical and NAND constructions.

# Universality

Why choose NAND as the building block? Because NAND alone can implement the three operations used by the canonical recipe.

```text
NOT a    = NAND(a, a)
t        = NAND(a, b)
a AND b  = NAND(t, t)
a OR b   = NAND(NAND(a, a), NAND(b, b))
```

Tying both NAND inputs to a gives 1 when a is 0 and 0 when a is 1: NOT. Inverting the result of NAND gives AND. Inverting both inputs and feeding them to NAND gives OR, an application of **De Morgan's law**.

Now join the arguments. Every Boolean truth table can be expressed with AND, OR, and NOT. Each of those can be built from NAND. Therefore every Boolean function can be built from NAND alone. This property is called **functional completeness** or universality.

NOR is another universal primitive. NAND is a useful starting point, not the only possible starting point. Other libraries use combinations of gates to suit their engineering goals.

This statement concerns combinational behavior: outputs determined by the present inputs. Remembering values over time introduces state and timing, which are separate concepts.

# Gates and physical signals

A **gate** is a device that implements a Boolean function. Its input and output pins are the places where signals enter and leave. A function with n inputs and m outputs has a corresponding interface with n input pins and m output pins.

In electronic chips, transistor networks implement switching behavior. Many such devices are fabricated in silicon. Other switching technologies can also implement Boolean logic; the logical rule does not depend on a particular material.

The two logical values abstract physical ranges of a signal. A 0 is not the absence of power to the whole computer. This site's bright wires mean a logical 1; they do not measure electrical current, voltage, delay, or energy.

Working at this level lets you reason about what a circuit does before dealing with its physical realization. Electrical engineering still matters: it determines whether a real implementation meets its timing, power, reliability, and manufacturing constraints.

# Interfaces and composition

A **primitive** is supplied as a working part. A **composite** is built by connecting other parts. From outside, both expose an interface: named pins and promised behavior.

For example, a three-input AND can be composed from two two-input AND gates:

```text
first = AND(a, b)
out   = AND(first, c)
```

The caller only needs the three-input contract. The designer needs to know the two parts and the internal wire joining them. A boundary hides the implementation without changing its behavior.

A part's output may feed several inputs. This is called **fan-out**. In the logical model it copies a value; it does not divide the value between destinations. Real circuits have electrical fan-out limits that this simulator does not model.

Many implementations can satisfy the same interface. A correct design must match the contract for every relevant input. A compact design may use fewer parts or fewer stages, but those structural measures do not by themselves establish physical speed or energy use.

# A worked XOR circuit

XOR is 1 for two situations: a is 1 while b is 0, or a is 0 while b is 1.

```text
XOR(a, b) = (a AND NOT b) OR (NOT a AND b)
```

The following HDL gives those intermediate signals names:

```hdl
CHIP Xor {
    IN a, b;
    OUT out;

    PARTS:
    Not(in=a, out=nota);
    Not(in=b, out=notb);
    And(a=a, b=notb, out=w1);
    And(a=nota, b=b, out=w2);
    Or(a=w1, b=w2, out=out);
}
```

[Open the worked XOR in the hardware simulator](/tools/hardware-simulator/Xor).

This uses five parts from a NOT/AND/OR library. XOR can also be built from four NAND gates. Those counts compare two logical constructions; different primitive libraries have different physical costs.

# Reading HDL

**HDL** means hardware description language. The syntax here describes a network of connected parts. It is not a sequence of commands for the chip to execute.

- `CHIP Xor` names the chip.
- `IN` and `OUT` declare the external pins.
- `PARTS:` introduces the internal components.
- `Not(in=a, out=nota)` connects external input a to a NOT gate, and names its output wire nota.
- `And(a=nota, b=b, out=w2)` consumes that same wire.

Part pin names belong to the part's interface. `Not` uses `in` and `out`; `And` uses `a`, `b`, and `out`. The names on the other side of `=` identify signals in the containing chip. They do not need to match the part's pin names.

One source can feed several destinations. A signal must have a source; attaching multiple drivers or creating a combinational feedback loop is not a valid circuit in this workbench. The visual and code views describe the same supported graph.

The project's HDL is an educational language. VHDL and Verilog are other hardware description languages with their own syntax and capabilities. Do not treat this syntax as interchangeable with them.

# Testing a construction

A circuit can look plausible and still be wrong. A repeatable test assigns input values, evaluates the circuit, and compares the observed outputs with the contract.

For XOR there are only four input combinations. Its complete expected output is:

| a   | b   | out |
| --- | --- | --- |
| 0   | 0   | 0   |
| 0   | 1   | 1   |
| 1   | 0   | 1   |
| 1   | 1   | 0   |

The guided workbench runs every case automatically. The hardware simulator also accepts a test script. One case looks like this:

```text
output-list a%B3.1.3 b%B3.1.3 out%B3.1.3;

set a 0,
set b 1,
eval,
output;
```

`output-list` chooses the displayed pins and their formatting. `set` assigns an input. `eval` evaluates the current circuit. `output` records a row. Repeat the cases and compare the recorded rows against the expected table.

Exhaustive testing of a deterministic, combinational model establishes its truth table. That is stronger than trying a few random inputs, but it does not verify physical fabrication, timing, power behavior, or the correctness of the simulator itself. For large interfaces, the number of cases grows exponentially and different verification techniques are needed.

# From a model to physical hardware

Connecting physical parts first and correcting them afterward would make experimentation slow and replication error-prone. An HDL model makes it easier to inspect, change, and test the design before manufacture.

Professional design flows can analyze timing, area, and power using models appropriate to the intended technology. They can translate a verified description toward a physical implementation. The tools here focus on Boolean behavior; they do not simulate those physical properties or manufacture a chip.

# Try the relationships yourself

Use [Learn](/learn) for guided construction, the [hardware simulator](/tools/hardware-simulator) for HDL and test scripts, and the [Boolean functions tool](/tools/boolean-functions) to connect arbitrary truth tables with expressions. Next, [scale the same rules to buses and selectors](/learn/reference/boolean-logic/project#buses).
