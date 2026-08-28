export const icon = (name: 'plus' | 'check' | 'clock' | 'settings' | 'edit' | 'trash' | 'tape') => {
  const paths: Record<string, string> = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>',
    settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4"/>',
    trash: '<path d="M5 7h14M9 7V4h6v3m2 0-1 13H8L7 7m3 4v5m4-5v5"/>',
    tape: '<rect x="3" y="6" width="18" height="12" rx="1"/><circle cx="8" cy="12" r="2.5"/><circle cx="16" cy="12" r="2.5"/><path d="M8 12h8"/>'
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">${paths[name]}</svg>`;
};
