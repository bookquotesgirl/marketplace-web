import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../i18n/i18n';

// Wraps components with the providers most screens need in tests (Router, i18n).
export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
