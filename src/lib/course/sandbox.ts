import { assemblerCases, gradeAssemblerOutputs, type CheckResult } from './verify.js';
/** Student code executes off the UI thread, in an opaque-origin frame with no network permission. */
export function verifyStudentAssembler(source: string): Promise<CheckResult> {
  if (source.length > 60000)
    return Promise.resolve({
      passed: false,
      message: 'Keep the assembler source below 60,000 characters.',
      cases: 0,
    });
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('title', 'Isolated assembler verification');
    const nonce = crypto.randomUUID();
    let settled = false;
    const finish = (result: CheckResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('message', receive);
      frame.contentWindow?.postMessage({ cancel: true }, '*');
      frame.remove();
      resolve(result);
    };
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.nonce !== nonce) return;
      const data = event.data;
      if (data.error)
        finish({ passed: false, message: String(data.error).slice(0, 400), cases: 0 });
      else finish(gradeAssemblerOutputs(data.outputs));
    };
    const timer = window.setTimeout(
      () =>
        finish({
          passed: false,
          message:
            'Verification stopped after 4 seconds. Check for an infinite loop or excessive work.',
          cases: 0,
        }),
      4000,
    );
    window.addEventListener('message', receive);
    const workerCode = `onmessage = ({data}) => { try { const fn = new Function('"use strict";'+data.source+'; return assemble;')(); if(typeof fn !== 'function') throw Error('Define function assemble(source).'); const outputs=data.programs.map(p=>fn(p)); if(outputs.some(v=>typeof v !== 'string'||v.length>200000)) throw Error('Return machine code as a string under 200,000 characters.'); postMessage({outputs}); } catch(error) { postMessage({error:String(error.message||error)}); } };`;
    const scriptEnd = '</' + 'script>';
    frame.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'; child-src 'none'; form-action 'none'; base-uri 'none'"><script>let worker;addEventListener('message',event=>{if(event.source!==parent)return;if(event.data.cancel){worker?.terminate();return;}if(worker)return;const data=event.data;worker=new Worker(URL.createObjectURL(new Blob([${JSON.stringify(workerCode)}],{type:'text/javascript'})));worker.onmessage=e=>{parent.postMessage({...e.data,nonce:data.nonce},'*');worker.terminate();};worker.onerror=()=>{parent.postMessage({error:'The assembler could not run.',nonce:data.nonce},'*');worker.terminate();};worker.postMessage(data);});${scriptEnd}`;
    frame.onload = () =>
      frame.contentWindow?.postMessage({ nonce, source, programs: assemblerCases }, '*');
    document.body.append(frame);
  });
}
