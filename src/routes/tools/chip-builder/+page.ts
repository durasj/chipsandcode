import { redirect } from '@sveltejs/kit';
import { readWorkshopDraft } from '#lib/computer/hardware-project.js';
export const ssr = false;
export const prerender = false;
export const load = () => {
  let hasDraft = false;
  if (typeof window !== 'undefined') {
    try {
      hasDraft = !!readWorkshopDraft(localStorage);
    } catch {
      /* Storage may be disabled. */
    }
  }
  redirect(
    307,
    hasDraft ? '/tools/hardware-simulator/workshop-draft' : '/tools/hardware-simulator/Inverter16',
  );
};
