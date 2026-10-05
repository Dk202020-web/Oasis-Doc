import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLang, text } from '../context/LangContext'
import BrandLogo from './BrandLogo'

const navLink = ({ isActive }) =>
  `rounded-xl px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-oasis-blue-light text-oasis-blue'
      : 'text-slate-600 hover:bg-slate-50 hover:text-oasis-blue'
  }`

function CartIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 4.5h2l1.8 10.2a2 2 0 0 0 2 1.7h7.8a2 2 0 0 0 1.9-1.5l1.2-6.4H7" />
      <circle cx="9.5" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
    </svg>
  )
}

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { items } = useCart()
  const { lang, toggleLang } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const en = lang === 'en'
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || ''
  const initial = (displayName.trim()[0] || user?.email?.[0] || '?').toUpperCase()

  function closeMobileMenu() {
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <BrandLogo />

          <div className="hidden items-center gap-1 lg:flex">
            <NavLink to="/" className={navLink} end>
              {text(lang, 'Accueil', 'Home')}
            </NavLink>
            <NavLink to="/services" className={navLink}>
              {text(lang, 'Services', 'Services')}
            </NavLink>
            <NavLink to="/comment-ca-marche" className={navLink}>
              {text(lang, 'Comment ça marche', 'How it works')}
            </NavLink>
            <NavLink to="/suivi" className={navLink}>
              {text(lang, 'Suivi', 'Tracking')}
            </NavLink>
            <NavLink to="/contact" className={navLink}>
              {text(lang, 'Contact', 'Contact')}
            </NavLink>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold tracking-wide text-slate-700 transition hover:border-oasis-blue hover:bg-oasis-blue-light hover:text-oasis-blue"
              title={text(lang, 'Changer de langue', 'Switch language')}
              aria-label={en ? 'Switch to French' : 'Switch to English'}
            >
              {lang.toUpperCase()}
            </button>
            <Link
              to="/panier"
              className="relative rounded-xl p-2 text-slate-700 transition hover:bg-oasis-blue-light"
              aria-label={text(lang, 'Panier', 'Cart')}
            >
              <CartIcon />
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-oasis-green px-1.5 text-xs font-bold text-white">
                  {items.length}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
              aria-label={
                mobileOpen
                  ? text(lang, 'Fermer le menu', 'Close menu')
                  : text(lang, 'Ouvrir le menu', 'Open menu')
              }
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
            >
              <span className="flex flex-col gap-1">
                <span className="h-0.5 w-4 rounded-full bg-current" />
                <span className="h-0.5 w-4 rounded-full bg-current" />
                <span className="h-0.5 w-4 rounded-full bg-current" />
              </span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-oasis-blue text-sm font-bold text-white shadow-sm ring-2 ring-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-oasis-blue focus:ring-offset-2"
                  aria-label={text(lang, 'Ouvrir le profil', 'Open profile')}
                  aria-expanded={profileOpen}
                  aria-controls="profile-menu"
                >
                  {initial}
                </button>
                {profileOpen && (
                  <div id="profile-menu" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="border-b border-slate-100 px-2 pb-3">
                      <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{profile?.email || user.email}</p>
                      {profile?.phone && <p className="mt-1 text-xs text-slate-500">{profile.phone}</p>}
                      {profile?.role === 'admin' && <span className="mt-2 inline-block rounded-full bg-oasis-blue-light px-2 py-0.5 text-xs font-semibold text-oasis-blue">Admin</span>}
                    </div>
                    <div className="flex flex-col pt-2">
                      <Link onClick={() => setProfileOpen(false)} to="/mes-commandes" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-oasis-blue">
                        {text(lang, 'Mes commandes', 'My orders')}
                      </Link>
                      <Link onClick={() => setProfileOpen(false)} to="/mes-equivalences" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-oasis-blue">
                        {text(lang, 'Mes devis diplôme', 'My diploma quotes')}
                      </Link>
                      {isAdmin && <Link onClick={() => setProfileOpen(false)} to="/admin" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-oasis-blue">Admin</Link>}
                      <button onClick={() => { setProfileOpen(false); signOut() }} className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-oasis-blue">
                        {text(lang, 'Déconnexion', 'Sign out')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/connexion"
                className="hidden btn-primary !px-3 !py-1.5 text-sm sm:inline-flex"
              >
                {text(lang, 'Connexion', 'Sign in')}
              </Link>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div id="mobile-navigation" className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg lg:hidden">
            <nav className="flex flex-col gap-1">
              <NavLink onClick={closeMobileMenu} to="/" className={navLink} end>
                {text(lang, 'Accueil', 'Home')}
              </NavLink>
              <NavLink onClick={closeMobileMenu} to="/services" className={navLink}>
                {text(lang, 'Services', 'Services')}
              </NavLink>
              <NavLink
                onClick={closeMobileMenu}
                to="/comment-ca-marche"
                className={navLink}
              >
                {text(lang, 'Comment ça marche', 'How it works')}
              </NavLink>
              <NavLink onClick={closeMobileMenu} to="/suivi" className={navLink}>
                {text(lang, 'Suivi', 'Tracking')}
              </NavLink>
              <NavLink onClick={closeMobileMenu} to="/contact" className={navLink}>
                {text(lang, 'Contact', 'Contact')}
              </NavLink>
              {!user ? (
                <Link
                  onClick={closeMobileMenu}
                  to="/connexion"
                  className="btn-primary mt-2 w-full"
                >
                  {text(lang, 'Connexion', 'Sign in')}
                </Link>
              ) : (
                <>
                  <Link
                    onClick={closeMobileMenu}
                    to="/mes-commandes"
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-oasis-blue"
                  >
                    {text(lang, 'Mes commandes', 'My orders')}
                  </Link>
                  <Link
                    onClick={closeMobileMenu}
                    to="/mes-equivalences"
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-oasis-blue"
                  >
                    {text(lang, 'Mes devis diplôme', 'My diploma quotes')}
                  </Link>
                  {isAdmin && (
                    <Link onClick={closeMobileMenu} to="/admin" className="btn-outline mt-2 w-full">
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      closeMobileMenu()
                      signOut()
                    }}
                    className="mt-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                  >
                    {text(lang, 'Déconnexion', 'Sign out')}
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

