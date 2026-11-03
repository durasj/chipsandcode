import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { assemble } from '#lib/computer/hack.js';
import { assemblerCases } from './verify.js';
import { verifyStudentAssembler } from './sandbox.js';
type SandboxMessage = {
  nonce?: string;
  source?: string;
  cancel?: boolean;
  outputs?: string[];
  error?: string;
};
type FrameEvent = { source: object; data: SandboxMessage };
type TestFrame = {
  hidden: boolean;
  srcdoc: string;
  setAttribute: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  contentWindow: { postMessage: ReturnType<typeof vi.fn> };
  onload?: () => void;
};
let receiver: (event: FrameEvent) => void;
let frame: TestFrame;
let payload: SandboxMessage;
beforeEach(() => {
  vi.useFakeTimers();
  frame = {
    hidden: false,
    srcdoc: '',
    setAttribute: vi.fn(),
    remove: vi.fn(),
    contentWindow: {
      postMessage: vi.fn((data: SandboxMessage) => {
        if (data.source) payload = data;
      }),
    },
    onload: undefined,
  };
  vi.stubGlobal('document', {
    createElement: () => frame,
    body: { append: () => frame.onload?.() },
  });
  vi.stubGlobal('window', {
    addEventListener: (_name: string, fn: (event: FrameEvent) => void) => {
      receiver = fn;
    },
    removeEventListener: vi.fn(),
    setTimeout,
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('isolates code behind a restrictive frame and validates its response', async () => {
  const promise = verifyStudentAssembler('function assemble(){}');
  expect(frame.srcdoc).toContain('</script>');
  expect(frame.srcdoc).toContain("connect-src 'none'");
  expect(frame.srcdoc).toContain('new Worker');
  expect(frame.setAttribute).toHaveBeenCalledWith('sandbox', 'allow-scripts');
  receiver({ source: {}, data: { nonce: payload.nonce, outputs: [] } });
  expect(frame.remove).not.toHaveBeenCalled();
  receiver({
    source: frame.contentWindow,
    data: { nonce: payload.nonce, outputs: assemblerCases.map((s) => assemble(s).binary) },
  });
  expect((await promise).passed).toBe(true);
  expect(frame.remove).toHaveBeenCalledOnce();
});
it('bounds execution time and disposes an infinite computation', async () => {
  const promise = verifyStudentAssembler('while(true){}');
  vi.advanceTimersByTime(4000);
  expect((await promise).message).toContain('4 seconds');
  expect(frame.contentWindow.postMessage).toHaveBeenCalledWith({ cancel: true }, '*');
});
it('surfaces errors and rejects oversized code', async () => {
  const promise = verifyStudentAssembler('bad code');
  receiver({ source: frame.contentWindow, data: { nonce: payload.nonce, error: 'Syntax error' } });
  expect((await promise).message).toBe('Syntax error');
  expect((await verifyStudentAssembler('x'.repeat(60001))).passed).toBe(false);
});
