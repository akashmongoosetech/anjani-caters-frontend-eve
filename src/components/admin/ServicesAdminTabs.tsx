import { NavLink } from 'react-router-dom';
import { Briefcase, FolderOpen, Layers } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const tabs = [
  { to: '/admin/services', label: 'All Services', icon: Briefcase, end: true, adminOnly: false },
  { to: '/admin/services/categories', label: 'Categories', icon: FolderOpen, end: false, adminOnly: true },
  { to: '/admin/services/subcategories', label: 'Sub-Categories', icon: Layers, end: false, adminOnly: true },
];

export default function ServicesAdminTabs() {
  const { hasRole } = useAdminAuth();
  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || hasRole(['Super Admin', 'Admin']));

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
      {visibleTabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isActive
                ? 'bg-secondary text-white shadow-sm'
                : 'text-slate-500 hover:text-secondary hover:bg-slate-50'
            }`
          }
        >
          <tab.icon className="w-4 h-4" />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
