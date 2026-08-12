import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { adminApi } from '../api'
import { useRemote } from '../app/useRemote'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { PageHeader } from '../components/layout/PageHeader'
import { StatusChip } from '../components/ui/StatusChip'
import type { EventStatus, EventSummary } from '../types'

const blankEvent: Partial<EventSummary> = { name: '', venue: '', description: '', startAt: '', endAt: '', reservationStartAt: '', reservationEndAt: '', status: 'DRAFT' }

export function AdminEventsPage() {
  const state = useRemote(adminApi.events, [])
  const [message, setMessage] = useState('')
  const remove = async (id: number) => { if (!window.confirm('연결된 신청·예약·판매가 없는 행사만 삭제할 수 있습니다. 삭제할까요?')) return; try { await adminApi.deleteEvent(id); await state.reload() } catch (caught) { setMessage(caught instanceof Error ? caught.message : '행사를 삭제하지 못했습니다.') } }
  const changeStatus = async (id: number, action: 'publish' | 'end') => { try { if (action === 'publish') await adminApi.publishEvent(id); else await adminApi.endEvent(id); await state.reload() } catch (caught) { setMessage(caught instanceof Error ? caught.message : '상태를 변경하지 못했습니다.') } }
  return <><PageHeader eyebrow="Admin · Events" title="행사 목록" description="행사를 등록하고 공개 또는 종료 상태를 관리합니다." actions={<Link className="btn primary" to="/admin/events/new">행사 등록</Link>} />{message && <div className="form-alert">{message}</div>}<div className="filter-bar"><input className="input" type="search" placeholder="행사명, 장소 검색" aria-label="관리자 행사 검색" /><select className="select" aria-label="행사 상태"><option>행사 상태 전체</option><option>진행중</option><option>진행 예정</option><option>종료</option></select></div>{state.loading ? <LoadingState label="행사를 불러오고 있습니다" /> : state.error ? <ErrorState error={state.error} retry={() => void state.reload()} /> : !state.data?.length ? <EmptyState title="등록된 행사가 없습니다" description="첫 행사를 등록해 크리에이터의 참가 신청을 받으세요." action={<Link className="btn primary" to="/admin/events/new">행사 등록</Link>} /> : <div className="table-wrap"><table><thead><tr><th>행사</th><th>기간</th><th>장소</th><th>상태</th><th>관리</th></tr></thead><tbody>{state.data.map((event) => <tr key={event.id}><td><strong>{event.name}</strong><small>{event.description}</small></td><td>{event.startAt.slice(0, 10)} — {event.endAt.slice(0, 10)}</td><td>{event.venue}</td><td><StatusChip tone={event.status === 'PUBLISHED' ? 'active' : event.status === 'ENDED' ? 'muted' : 'warning'}>{event.status}</StatusChip></td><td><div className="row-actions"><Link className="btn subtle" to={`/admin/events/${event.id}`}>수정</Link>{event.status === 'DRAFT' && <button className="btn secondary" onClick={() => void changeStatus(event.id, 'publish')}>공개</button>}{event.status === 'PUBLISHED' && <button className="btn secondary" onClick={() => void changeStatus(event.id, 'end')}>종료</button>}<button className="btn danger subtle" onClick={() => void remove(event.id)}>삭제</button></div></td></tr>)}</tbody></table></div>}</>
}

export function AdminEventFormPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const existing = useRemote(() => eventId && eventId !== 'new' ? adminApi.event(eventId) : Promise.resolve(null), [eventId])
  const [draft, setDraft] = useState<Partial<EventSummary> | null>(null)
  const [error, setError] = useState('')
  const value = draft ?? existing.data ?? blankEvent
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!value.name?.trim() || !value.venue?.trim() || !value.startAt || !value.endAt) { setError('행사명, 기간, 장소를 입력해 주세요.'); return }
    if (new Date(value.startAt) >= new Date(value.endAt)) { setError('행사 시작일은 종료일보다 빨라야 합니다.'); return }
    if (value.reservationStartAt && value.reservationEndAt && new Date(value.reservationStartAt) >= new Date(value.reservationEndAt)) { setError('예약 시작일은 예약 종료일보다 빨라야 합니다.'); return }
    try {
      const payload = {
        ...value,
        startAt: new Date(value.startAt).toISOString(),
        endAt: new Date(value.endAt).toISOString(),
        reservationStartAt: value.reservationStartAt ? new Date(value.reservationStartAt).toISOString() : undefined,
        reservationEndAt: value.reservationEndAt ? new Date(value.reservationEndAt).toISOString() : undefined,
      }
      if (eventId && eventId !== 'new') await adminApi.updateEvent(Number(eventId), payload)
      else await adminApi.createEvent(payload)
      void navigate('/admin/events')
    } catch (caught) { setError(caught instanceof Error ? caught.message : '행사를 저장하지 못했습니다.') }
  }
  if (existing.loading) return <LoadingState label="행사 정보를 불러오고 있습니다" />
  if (existing.error) return <ErrorState error={existing.error} retry={() => void existing.reload()} />
  const update = (part: Partial<EventSummary>) => setDraft({ ...value, ...part })
  return <><PageHeader eyebrow="Admin · Event" title="행사 등록/수정" description="팬에게 공개할 행사 기본 정보와 운영 기간을 입력합니다." /><form className="panel form-panel wide-form" onSubmit={(event) => void save(event)}>{error && <div className="form-alert">{error}</div>}<h2>행사 기본정보</h2><div className="form-grid"><label className="field full"><span>행사명</span><input className="input" required value={value.name ?? ''} onChange={(event) => update({ name: event.target.value })} /></label><label className="field"><span>행사 시작</span><input className="input" type="datetime-local" required value={toLocal(value.startAt)} onChange={(event) => update({ startAt: event.target.value })} /></label><label className="field"><span>행사 종료</span><input className="input" type="datetime-local" required value={toLocal(value.endAt)} onChange={(event) => update({ endAt: event.target.value })} /></label><label className="field"><span>예약 시작</span><input className="input" type="datetime-local" value={toLocal(value.reservationStartAt)} onChange={(event) => update({ reservationStartAt: event.target.value })} /></label><label className="field"><span>예약 종료</span><input className="input" type="datetime-local" value={toLocal(value.reservationEndAt)} onChange={(event) => update({ reservationEndAt: event.target.value })} /></label><label className="field full"><span>장소</span><input className="input" required value={value.venue ?? ''} onChange={(event) => update({ venue: event.target.value })} /></label><label className="field full"><span>행사 소개</span><textarea className="textarea" rows={6} value={value.description ?? ''} onChange={(event) => update({ description: event.target.value })} /></label><label className="field"><span>행사 상태</span><select className="select" value={value.status} onChange={(event) => update({ status: event.target.value as EventStatus })}><option value="DRAFT">준비중</option><option value="PUBLISHED">공개중</option><option value="ENDED">종료</option></select></label></div><div className="panel-actions"><Link className="btn secondary" to="/admin/events">취소</Link><button className="btn primary">행사 저장</button></div></form></>
}

export function AdminApplicationsPage() {
  const state = useRemote(adminApi.applications, [])
  const [message, setMessage] = useState('')
  const decide = async (id: number, decision: 'approve' | 'reject') => { try { if (decision === 'approve') await adminApi.approve(id); else { const reason = window.prompt('반려 사유를 입력해 주세요.') ?? ''; if (!reason.trim()) return; await adminApi.reject(id, reason) } await state.reload() } catch (caught) { setMessage(caught instanceof Error ? caught.message : '신청 상태를 변경하지 못했습니다.') } }
  return <><PageHeader eyebrow="Admin · Applications" title="행사 참가 신청" description="크리에이터의 부스 참가 신청을 확인하고 승인 또는 반려합니다." />{message && <div className="form-alert">{message}</div>}{state.loading ? <LoadingState label="참가 신청을 불러오고 있습니다" /> : state.error ? <ErrorState error={state.error} retry={() => void state.reload()} /> : !state.data?.length ? <EmptyState title="대기 중인 참가 신청이 없습니다" description="새 신청이 접수되면 이곳에 표시됩니다." /> : <div className="table-wrap"><table><thead><tr><th>행사</th><th>부스</th><th>크리에이터</th><th>상태</th><th>관리</th></tr></thead><tbody>{state.data.map((application) => <tr key={application.id}><td>{application.eventName}</td><td>{application.boothName}</td><td>{application.creatorName}</td><td><StatusChip tone={application.status === 'APPROVED' ? 'active' : application.status === 'REJECTED' ? 'danger' : 'warning'}>{application.status}</StatusChip></td><td><div className="row-actions"><button className="btn primary" disabled={application.status !== 'PENDING'} onClick={() => void decide(application.id, 'approve')}>승인</button><button className="btn secondary" disabled={application.status !== 'PENDING'} onClick={() => void decide(application.id, 'reject')}>반려</button></div></td></tr>)}</tbody></table></div>}</>
}

function toLocal(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}
