import {
  Smartphone,
  ShoppingBag,
  Coffee,
  CookingPot,
  WashingMachine,
  Shirt,
  Sparkles,
  Armchair,
  ShoppingCart,
  Store,
} from 'lucide-react';

// Maps known category slugs to an icon + the i18n key used in locales/*.json `categories`.
// Categories come from the live API and may include slugs outside this list — callers should
// fall back to the API's own `name` and a generic icon for those.
export const CATEGORY_ICONS = {
  electronics: { Icon: Smartphone, i18nKey: 'categories.electronics' },
  fashion: { Icon: ShoppingBag, i18nKey: 'categories.fashion' },
  'coffee-spice': { Icon: Coffee, i18nKey: 'categories.coffeeSpice' },
  'home-kitchen': { Icon: CookingPot, i18nKey: 'categories.homeKitchen' },
  appliances: { Icon: WashingMachine, i18nKey: 'categories.appliances' },
  'habesha-kemis': { Icon: Shirt, i18nKey: 'categories.habeshaKemis' },
  cosmetics: { Icon: Sparkles, i18nKey: 'categories.cosmetics' },
  furniture: { Icon: Armchair, i18nKey: 'categories.furniture' },
  supermarket: { Icon: ShoppingCart, i18nKey: 'categories.supermarket' },
};

export const DEFAULT_CATEGORY_ICON = Store;
