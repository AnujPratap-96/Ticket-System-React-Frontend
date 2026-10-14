/**
 * Per-workspace brand colour. Screens use Tailwind's fixed indigo palette, so instead of touching every
 * component we inject one small stylesheet that re-points the interactive indigo utilities at the workspace colour.
 */
const ID = 'workspace-brand';
const HEX = /^#[0-9a-fA-F]{6}$/;

export function applyBrandColor(color) {
  document.getElementById(ID)?.remove();
  if (!color || !HEX.test(color)) return;
  const dark = `color-mix(in srgb, ${color} 82%, black)`;
  const tint = `color-mix(in srgb, ${color} 10%, white)`;
  const style = document.createElement('style');
  style.id = ID;
  style.textContent = `
    .bg-indigo-600, .hover\\:bg-indigo-600:hover { background-color: ${color} !important; }
    .bg-indigo-700, .hover\\:bg-indigo-700:hover { background-color: ${dark} !important; }
    .bg-indigo-50, .hover\\:bg-indigo-50:hover { background-color: ${tint} !important; }
    .text-indigo-600, .text-indigo-700, .hover\\:text-indigo-700:hover { color: ${color} !important; }
    .border-indigo-600, .focus\\:border-indigo-500:focus, .border-indigo-200 { border-color: ${color} !important; }
    .ring-indigo-500, .focus\\:ring-indigo-500:focus, .focus-visible\\:ring-indigo-500:focus-visible { --tw-ring-color: ${color} !important; }
  `;
  document.head.appendChild(style);
}
