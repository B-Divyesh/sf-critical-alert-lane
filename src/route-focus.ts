const ROUTE_FOCUS_KEY = 'critical-alert-lane:focus-heading';

function announceAndFocusHeading(): void {
  const heading = document.querySelector<HTMLElement>('main h1');
  if (!heading) return;
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
  let status = document.querySelector<HTMLElement>('#route-status');
  if (!status) {
    status = document.createElement('div');
    status.id = 'route-status';
    status.className = 'sr-only';
    status.setAttribute('aria-live', 'polite');
    document.body.append(status);
  }
  status.textContent = heading.textContent?.trim() ?? 'Page loaded';
}

document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || link.hasAttribute('download')) return;
  link.addEventListener('click', () => sessionStorage.setItem(ROUTE_FOCUS_KEY, '1'));
});

const cameFromProductRoute = sessionStorage.getItem(ROUTE_FOCUS_KEY) === '1';
if (cameFromProductRoute) {
  sessionStorage.removeItem(ROUTE_FOCUS_KEY);
  window.requestAnimationFrame(announceAndFocusHeading);
}

window.addEventListener('pageshow', event => {
  if (event.persisted && sessionStorage.getItem(ROUTE_FOCUS_KEY) === '1') {
    sessionStorage.removeItem(ROUTE_FOCUS_KEY);
    announceAndFocusHeading();
  }
});
