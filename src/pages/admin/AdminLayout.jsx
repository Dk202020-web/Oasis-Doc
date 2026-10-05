import { Link, NavLink, Outlet } from 'react-router-dom'

const link = ({ isActive }) =>
  `block shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-oasis-blue text-white' : 'text-slate-600 hover:bg-slate-100'
  }`

export default function AdminLayout() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:py-8 lg:flex-row lg:gap-6">
      <aside className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 lg:block lg:w-48 lg:shrink-0 lg:space-y-1 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0">
        <div className="hidden px-3 pb-2 text-xs font-bold uppercase tracking-wide text-slate-400 lg:block">
          Administration
        </div>
        <NavLink to="/admin" end className={link}>
          Vue d’ensemble
        </NavLink>
        <NavLink to="/admin/requests" className={link}>
          Demandes
        </NavLink>
        <NavLink to="/admin/catalog" className={link}>
          Catalogue
        </NavLink>
        <NavLink to="/admin/admins" className={link}>
          Co-admins
        </NavLink>
        <NavLink to="/admin/settings" className={link}>
          Réglages
        </NavLink>
        <NavLink to="/admin/equivalences" className={link}>
          Équivalences diplômes
        </NavLink>
        <Link to="/services" className="block shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-oasis-blue hover:bg-oasis-blue-light">
          Voir les services
        </Link>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
