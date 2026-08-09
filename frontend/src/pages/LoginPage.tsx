import { useAuth } from '../app/useAuth'

export function LoginPage() {
  const { loginUrl } = useAuth()
  return <section className="auth-page section-pad"><div className="auth-intro"><p className="eyebrow">Welcome to BoothHana2</p><h1>이용 유형을<br />선택하세요</h1><p className="lead">하나의 카카오 계정으로 팬 또는 크리에이터 역할을 사용합니다.</p></div><div className="auth-options"><article className="auth-card"><span className="brand-mark">F</span><h2>팬으로 로그인</h2><p>행사와 부스를 살펴보고 원하는 굿즈를 예약합니다.</p><a className="btn primary wide" href={`${loginUrl}?role=FAN`}>카카오로 계속하기</a></article><article className="auth-card"><span className="brand-mark teal">C</span><h2>크리에이터로 로그인</h2><p>행사 참가, 부스와 굿즈, 예약 수령과 POS를 관리합니다.</p><a className="btn secondary wide" href={`${loginUrl}?role=CREATOR`}>카카오로 계속하기</a></article></div></section>
}
