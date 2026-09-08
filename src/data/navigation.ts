export interface NavSubItem {
  id: string;
  nameKey: string;
  path: string;
  icon?: string;
  desc?: string;
  featured?: boolean;
}

export interface NavItem {
  id: string;
  nameKey: string;
  path?: string;
  dropdown?: NavSubItem[];
}

export const navigationConfig: NavItem[] = [
  {
    id: 'home',
    nameKey: 'home',
    path: '/',
  },
  {
    id: 'about',
    nameKey: 'about',
    path: '/about',
  },
  {
    id: 'services',
    nameKey: 'services',
    path: '/services',
  },
  {
    id: 'menu',
    nameKey: 'menu',
    path: '/menu',
  },
  {
    id: 'gallery',
    nameKey: 'gallery',
    path: '/gallery',
  },
  {
    id: 'explore',
    nameKey: 'explore',
    dropdown: [
      // {
      //   id: 'packages',
      //   nameKey: 'packages',
      //   path: '/packages',
      //   icon: 'Package',
      //   desc: 'Curated royal catering & event packages',
      //   featured: true,
      // },
      {
        id: 'blogs',
        nameKey: 'blog',
        path: '/blogs',
        icon: 'BookOpen',
        desc: 'Culinary trends and banqueting tips',
        featured: true,
      },
      
      {
        id: 'projects',
        nameKey: 'projects',
        path: '/projects',
        icon: 'Briefcase',
        desc: 'Portfolio of successful luxury events',
      },
      
      {
        id: 'team',
        nameKey: 'ourTeam',
        path: '/team',
        icon: 'Users',
        desc: 'Meet our master chefs and coordinators',
      },
      {
        id: 'testimonials',
        nameKey: 'testimonials',
        path: '/testimonials',
        icon: 'Star',
        desc: 'Read glowing reviews from happy hosts',
      },
      {
        id: 'faqs',
        nameKey: 'faqs',
        path: '/faqs',
        icon: 'HelpCircle',
        desc: 'Common questions about our catering',
      },
    ],
  },
  {
    id: 'contact',
    nameKey: 'contact',
    path: '/contact',
  },
  {
    id: 'booking',
    nameKey: 'booking',
    path: '/booking',
  },
];

/**
 * Checks if a path is active against the current pathname.
 */
export function isPathActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/') {
    return pathname === '/';
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/**
 * Checks if a dropdown item or any of its sub-items is active against current pathname.
 */
export function isDropdownActive(pathname: string, subItems: NavSubItem[]): boolean {
  return subItems.some((sub) => isPathActive(pathname, sub.path));
}
