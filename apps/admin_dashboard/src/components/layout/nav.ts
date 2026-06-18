import { UserRole } from '@kawkaw/shared-types';
import type { IconName } from './icons';

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  roles: UserRole[];
  /** match nested routes (e.g. /orders/:id) for active state */
  match?: string;
}

const ALL_STAFF: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPPORT];
const MANAGERS: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
const SUPER: UserRole[] = [UserRole.SUPER_ADMIN];

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/', icon: 'dashboard', roles: ALL_STAFF, match: '/' },
      { label: 'Orders', href: '/orders', icon: 'orders', roles: ALL_STAFF, match: '/orders' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', href: '/products', icon: 'products', roles: MANAGERS, match: '/products' },
      { label: 'Categories', href: '/categories', icon: 'categories', roles: MANAGERS, match: '/categories' },
      { label: 'Inventory', href: '/inventory', icon: 'inventory', roles: MANAGERS, match: '/inventory' },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Users & Riders', href: '/users', icon: 'users', roles: ALL_STAFF, match: '/users' },
      { label: 'Pharmacy', href: '/pharmacy', icon: 'pharmacy', roles: ALL_STAFF, match: '/pharmacy' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Notifications', href: '/notifications', icon: 'notifications', roles: MANAGERS, match: '/notifications' },
      { label: 'Analytics', href: '/analytics', icon: 'analytics', roles: MANAGERS, match: '/analytics' },
      { label: 'Audit Log', href: '/audit', icon: 'audit', roles: MANAGERS, match: '/audit' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Admins', href: '/admins', icon: 'admins', roles: SUPER, match: '/admins' },
      { label: 'Settings', href: '/settings', icon: 'settings', roles: MANAGERS, match: '/settings' },
    ],
  },
];

export function visibleNav(role: UserRole): NavSection[] {
  return NAV.map((s) => ({ ...s, items: s.items.filter((i) => i.roles.includes(role)) })).filter((s) => s.items.length > 0);
}
