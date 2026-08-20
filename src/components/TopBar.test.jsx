import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import TopBar from './TopBar';
import { useApplyLanguage } from '../hooks/useApplyLanguage';
import { useUiStore } from '../store/uiStore';

function TopBarWithLanguageEffect() {
  useApplyLanguage();
  return <TopBar />;
}

beforeEach(() => {
  useUiStore.setState({ language: 'en', dark: false });
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
});

describe('TopBar language switching', () => {
  it('cycles English -> Amharic -> Arabic and mirrors the page to RTL on Arabic', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopBarWithLanguageEffect />);
    const languageButton = screen.getByRole('button', { name: 'Language' });

    await user.click(languageButton); // en -> am
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('am');

    await user.click(languageButton); // am -> ar
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });
});
