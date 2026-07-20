import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import BrandLogo from './BrandLogo'

const navLink = ({ isActive }) => `rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-oasis-blue-light text-oasis-blue' : 'text-slate-600 hover:bg-slate-50 hover:text-oasis-blue'}`

function CartIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 4.5h2l1.8 10.2a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.5l1.2-6.4H7" /><circle cx="9.5" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>
}

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const { items } = useCart()
  const { lang, toggleLang } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)
  const en = lang === 'en'

  function closeMobileMenu() {
    setMobileOpen(false)
  }

  return <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
    <div className="mx-auto max-w-6xl px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <BrandLogo />

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navLink} end>{en ? 'Home' : 'Accueil'}</NavLink>
          <NavLink to="/services" className={navLink}>Services</NavLink>
          <NavLink to="/comment-ca-marche" className={navLink}>{en ? 'How it works' : 'Comment ça marche'}</NavLink>
          <NavLink to="/suivi" className={navLink}>{en ? 'Track order' : 'Suivi'}</NavLink>
          <NavLink to="/contact" className={navLink}>Contact</NavLink>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold tracking-wide text-slate-700 transition hover:border-oasis-blue hover:bg-oasis-blue-light hover:text-oasis-blue" title="Changer de langue / Switch language" aria-label={en ? 'Switch to French' : 'Switch to English'}>{lang.toUpperCase()}</button>
          <Link to="/panier" className="relative rounded-xl p-2 text-slate-700 transition hover:bg-oasis-blue-light" aria-label={en ? 'Cart' : 'Panier'}><CartIcon />{items.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-oasis-green px-1.5 text-xs font-bold text-white">{items.length}</span>}</Link>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-4 rounded-full bg-current" />
              <span className="h-0.5 w-4 rounded-full bg-current" />
              <span className="h-0.5 w-4 rounded-full bg-current" />
            </span>
          </button>
          {user ? <div className="hidden items-center gap-2 sm:flex"><Link to="/mes-commandes" className="text-sm font-semibold text-slate-600 hover:text-oasis-blue">{en ? 'My orders' : 'Mes commandes'}</Link>{isAdmin && <Link to="/admin" className="btn-outline !px-3 !py-1.5 text-sm">Admin</Link>}<button onClick={signOut} className="text-sm font-medium text-slate-500 hover:text-oasis-blue">{en ? 'Sign out' : 'Déconnexion'}</button></div> : <Link to="/connexion" className="btn-primary !px-3 !py-1.5 text-sm hidden sm:inline-flex">{en ? 'Sign in' : 'Connexion'}</Link>}
        </div>
      </div>

      {mobileOpen && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1">
            <NavLink onClick={closeMobileMenu} to="/" className={navLink} end>{en ? 'Home' : 'Accueil'}</NavLink>
            <NavLink onClick={closeMobileMenu} to="/services" className={navLink}>Services</NavLink>
            <NavLink onClick={closeMobileMenu} to="/comment-ca-marche" className={navLink}>{en ? 'How it works' : 'Comment ça marche'}</NavLink>
            <NavLink onClick={closeMobileMenu} to="/suivi" className={navLink}>{en ? 'Track order' : 'Suivi'}</NavLink>
            <NavLink onClick={closeMobileMenu} to="/contact" className={navLink}>Contact</NavLink>
            {!user ? (
              <Link onClick={closeMobileMenu} to="/connexion" className="btn-primary mt-2 w-full">{en ? 'Sign in' : 'Connexion'}</Link>
            ) : (
              <>
                <Link onClick={closeMobileMenu} to="/mes-commandes" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-oasis-blue">{en ? 'My orders' : 'Mes commandes'}</Link>
                {isAdmin && <Link onClick={closeMobileMenu} to="/admin" className="btn-outline mt-2 w-full">Admin</Link>}
                <button onClick={() => { closeMobileMenu(); signOut() }} className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">{en ? 'Sign out' : 'Déconnexion'}</button>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  </header>
}
