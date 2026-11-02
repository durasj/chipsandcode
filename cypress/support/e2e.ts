import './commands';

Cypress.Screenshot.defaults({ capture: 'viewport' });

Cypress.on('uncaught:exception', (err) => {
  // Monaco diff problem
  if (
    err.message.includes('ResizeObserver loop limit') ||
    err.message.includes('ResizeObserver loop completed with undelivered notifications')
  ) {
    return false;
  }
});
