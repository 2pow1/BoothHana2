import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../../app/useAuth'

export function PublicLayout() {
  const { user, loginUrl, logout } = useAuth()
  return <div className="page-shell">
    <header className="topbar">
      <Link className="brand" to="/"><span className="brand-mark">BH</span><span>BoothHana2</span></Link>
      <nav className="topbar-actions public-nav" aria-label="팬 주요 메뉴">
        <NavLink to="/events">행사</NavLink>
        <NavLink to="/reservations">내 예약</NavLink>
        {user?.role === 'CREATOR' && <NavLink to="/creator">크리에이터</NavLink>}
        {user?.role === 'ADMIN' && <NavLink to="/admin/events">관리자</NavLink>}
        {user ? <button className="btn subtle" onClick={() => void logout()}>로그아웃</button> : <a className="btn primary" href={loginUrl}>카카오 로그인</a>}
      </nav>
    </header>
    <main><Outlet /></main>
    <footer className="site-footer"><div className="site-footer-inner"><div><strong>BoothHana2</strong><p>행사, 크리에이터, 굿즈 예약 정보를 한 곳에서 확인합니다.</p></div><nav className="footer-links" aria-label="서비스 정보"><Link to="/events">행사</Link><Link to="/login">로그인</Link></nav></div></footer>
  </div>
}
