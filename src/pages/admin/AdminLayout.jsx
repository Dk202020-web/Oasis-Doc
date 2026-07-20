import { NavLink, Outlet } from 'react-router-dom'

const link = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-oasis-blue text-white' : 'text-slate-600 hover:bg-slate-100'
  }`

export default function AdminLayout() {
  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
      <aside className="w-48 shrink-0 space-y-1">
        <NavLink to="/admin" end className={link}>
          Dashboard
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
      </aside>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
