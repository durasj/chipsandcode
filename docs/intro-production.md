# Computer journey: intro film

The introduction is a 48-second, 1280 × 720 motion film at 30 fps. It introduces the broader signals-to-software journey. The homepage separately uses a scroll-driven computer disassembly and chip close-up. The original Chips and Code logo is used unchanged.

## Current media state

`static/media/computer-intro.mp4` is a **silent visual master**. Captions and a plain-text transcript provide the complete explanation. A natural narration track still needs to be generated or recorded and muxed into the film. The current asset must not be described as narrated or as having a voiceover.

The film introduces the relationship between computer layers. The site includes single-bit construction and dedicated Boolean-function and bus/routing labs; arithmetic, memory, architecture, and software remain conceptual previews.

## Assets

| File                            | Purpose                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `computer-intro.mp4`            | H.264 / yuv420p video with fast-start metadata                                    |
| `computer-intro-poster.jpg`     | Original brand and complete abstraction stack                                     |
| `computer-intro.vtt`            | Timed English captions, reserving the lower part of the frame                     |
| `computer-intro-transcript.txt` | Plain-text equivalent of the narration                                            |
| `computer-intro-timing.json`    | Authoritative scene timing, narration, palette/example descriptions, audio status |

The renderer is `scripts/render-computer-intro.py`. It uses Pillow and NumPy for precise vector-like frames, the repository's `sharp` dependency for the original SVG mark, and FFmpeg for encoding. No generated raster imagery or browser automation is involved.

## Sequence

| Time        | Layer          | Motion and technical meaning                                                                      |
| ----------- | -------------- | ------------------------------------------------------------------------------------------------- |
| 0.0–4.8 s   | Signals        | A sampled two-level waveform introduces 0 and 1.                                                  |
| 4.8–12.2 s  | Logic          | NAND cycles through all four input cases; live wire values and the truth row agree.               |
| 12.2–20.2 s | Arithmetic     | A four-bit addition develops from right to left: `0011 + 0001 = 0100`.                            |
| 20.2–28.2 s | Memory         | An eight-bit register loads `10110100` at the rising clock edge, then holds it.                   |
| 28.2–36.2 s | Architecture   | A conceptual fetch/decode/execute/write-back sequence evaluates `D = D + A` with `D=3` and `A=1`. |
| 36.2–43.4 s | Software       | `add(3, 1)` returns `4`, presenting the same idea at a higher level.                              |
| 43.4–48.0 s | Complete stack | The five layers separate into one view, ending with “Start with logic.”                           |

Color moves through `#070910`, `#111526`, `#303a57`, `#a6afc7`, and `#f2f1f7`. Indigo remains `#4f46e5`. Signal markers denote Boolean values and conceptual data flow, not electrical measurements or physical propagation speed.

## Rebuilding

Run from the repository with Node dependencies installed and Pillow, NumPy, FFmpeg, DejaVu Sans Mono, and Nimbus Sans available:

```sh
python scripts/render-computer-intro.py
```

Review stills are written outside the repository to `../intro-review` by default. To change that location, set `INTRO_REVIEW_DIRECTORY`. Use `--stills-only` to inspect the composition without re-encoding the film.

To add a finished, authorized voice recording or generated narration:

```sh
python scripts/render-computer-intro.py --audio /absolute/path/narration.wav
```

The narration should follow the exact segment timing in the JSON file. Use a natural, clear English voice, calm and precise, with breathing room between layers. The script is approximately 110 words per minute overall; avoid speeding through the transitions. No imitation of an identifiable person is needed.

The renderer normalizes the supplied audio to -16 LUFS with a -1.5 dBTP ceiling, pads to the 48-second duration, encodes AAC, and changes the timing JSON's `audio_status` to `narrated`. Captions and transcript must be revised if the spoken script changes. Listen to the finished track and verify scene synchronization before publishing it as a voiced introduction.
