import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../../app/useAuth'

const creatorLinks = [
  ['/creator', '홈'], ['/creator/events', '행사'], ['/creator/booths', '부스'],
  ['/creator/reservations', '예약'], ['/creator/pos', 'POS'], ['/creator/notices', '공지'],
]
const adminLinks = [['/admin/events', '행사'], ['/admin/applications', '참가 신청']]

export function ConsoleLayout({ role }: { role: 'CREATOR' | 'ADMIN' }) {
  const { user, loading, loginUrl } = useAuth()
  const links = role === 'CREATOR' ? creatorLinks : adminLinks
  const title = role === 'CREATOR' ? 'Creator Console' : 'Admin Console'

  if (loading) return <div className="state-panel"><span className="spinner" /><h2>계정을 확인하고 있습니다</h2></div>
  if (!user) return <div className="state-panel"><h2>로그인이 필요합니다</h2><p>카카오 계정으로 로그인한 뒤 다시 확인해 주세요.</p><a className="btn primary" href={loginUrl}>카카오 로그인</a></div>
  if (!user.permissions.includes(role)) return <div className="state-panel error-state"><h2>접근 권한이 없습니다</h2><p>현재 계정은 이 관리 화면을 사용할 수 없습니다.</p><NavLink className="btn secondary" to="/">팬 화면으로</NavLink></div>

  return <div className="console-shell">
    <header className="topbar console-topbar"><NavLink className="brand" to="/" aria-label="부스하나 홈"><span className="brand-logo"><img src="/assets/brand/logo.png" alt="부스하나" /></span></NavLink><div className="topbar-actions"><NavLink className="btn secondary" to="/">팬 화면</NavLink><span className="chip muted">{title}</span></div></header>
    <nav className="mobile-role-nav" aria-label={`${title} 모바일 메뉴`}>{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/creator'}>{label}</NavLink>)}</nav>
    <aside className="sidebar"><p className="eyebrow">{title}</p><strong className="sidebar-user">{user.displayName}</strong><nav className="side-nav">{links.map(([to, label]) => <NavLink key={to} className="side-link" to={to} end={to === '/creator'}>{label}</NavLink>)}</nav><NavLink className="side-link" to="/">팬 화면</NavLink></aside>
    <main className="console-main"><Outlet /></main>
  </div>
}
