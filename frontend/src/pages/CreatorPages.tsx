import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { creatorApi } from '../api'
import { useRemote } from '../app/useRemote'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { PageHeader } from '../components/layout/PageHeader'
import { StatusChip } from '../components/ui/StatusChip'
import { ImageUploader } from '../components/ui/ImageUploader'
import { formatPrice } from '../utils/format'
import type { BoothNotice, BoothSummary, EventProduct, EventSummary, ReservationItem } from '../types'

function creatorEventState(event: EventSummary) {
  if (event.applicationStatus === 'PENDING') return { label: '승인 대기', tone: 'warning' as const, button: '신청 완료' }
  if (event.applicationStatus === 'APPROVED') return { label: '승인 완료', tone: 'active' as const, button: '승인 완료' }
  if (event.applicationStatus === 'REJECTED') return { label: '반려', tone: 'danger' as const, button: '반려됨' }
  if (event.status === 'PUBLISHED') return { label: '신청 가능', tone: 'active' as const, button: '참가 신청' }
  return { label: event.status === 'ENDED' ? '종료' : '준비중', tone: 'muted' as const, button: '참가 신청' }
}

function eventBoothLabel(booth: BoothSummary, events?: EventSummary[] | null) {
  const event = events?.find((item) => item.id === booth.eventId)
  return event ? `${booth.name} · ${event.name}` : booth.name
}

export function CreatorHomePage() {
  return <><PageHeader eyebrow="Creator · Dashboard" title="크리에이터 홈" description="행사 준비부터 현장 예약 수령과 POS까지, 지금 필요한 작업만 확인하세요." /><div className="metric-grid"><article><span>진행 부스</span><strong>—</strong><small>승인된 행사 부스</small></article><article><span>예약 대기</span><strong>—</strong><small>수령 전 예약</small></article><article><span>공개 상품</span><strong>—</strong><small>예약·현장 판매 상품</small></article></div><div className="dashboard-grid"><article className="panel"><h2>오늘 할 일</h2><div className="quick-links"><Link to="/creator/events">행사 참가 신청 <span>→</span></Link><Link to="/creator/booths">부스 정보 관리 <span>→</span></Link><Link to="/creator/reservations">예약 수령 처리 <span>→</span></Link><Link to="/creator/pos">POS 판매 기록 <span>→</span></Link></div></article><article className="panel editorial-panel"><p className="eyebrow">Recent Booth</p><h2>최근 부스를 준비하세요</h2><p>부스 소개, 상품 재고, 공지를 순서대로 점검하면 공개 페이지에 바로 반영됩니다.</p><Link className="btn primary" to="/creator/booths">내 부스 보기</Link></article></div></>
}

export function CreatorEventsPage() {
  const events = useRemote(creatorApi.events, [])
  const booths = useRemote(creatorApi.booths, [])
  const [message, setMessage] = useState('')
  const apply = async (eventId: number) => {
    const boothId = booths.data?.[0]?.id
    if (!boothId) { setMessage('먼저 기본 부스를 만들어 주세요.'); return }
    try { await creatorApi.apply(eventId, boothId); await events.reload(); setMessage('참가 신청을 저장했습니다.') } catch (error) { setMessage(error instanceof Error ? error.message : '참가 신청을 저장하지 못했습니다.') }
  }
  return <><PageHeader eyebrow="Creator · Events" title="행사 목록" description="참가할 행사를 확인하고 내 부스로 신청합니다." />{message && <div className="notice-banner">{message}</div>}{events.loading ? <LoadingState label="행사를 불러오고 있습니다" /> : events.error ? <ErrorState error={events.error} retry={() => void events.reload()} /> : !events.data?.length ? <EmptyState title="참가 가능한 행사가 없습니다" description="관리자가 행사를 공개하면 이곳에 표시됩니다." /> : <div className="console-list">{events.data.map((event) => { const state = creatorEventState(event); return <article className="list-row" key={event.id}><div><StatusChip tone={state.tone}>{state.label}</StatusChip><h2>{event.name}</h2><p className="item-meta">{event.venue} · {event.startAt.slice(0, 10)} — {event.endAt.slice(0, 10)}</p></div><button className="btn primary" disabled={event.status !== 'PUBLISHED' || Boolean(event.applicationStatus)} onClick={() => void apply(event.id)}>{state.button}</button></article> })}</div>}</>
}

export function CreatorBoothsPage() {
  const state = useRemote(creatorApi.booths, [])
  const approved = useRemote(creatorApi.eventBooths, [])
  const [editing, setEditing] = useState<Partial<BoothSummary> | null>(null)
  const [error, setError] = useState('')
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!editing?.name?.trim()) { setError('부스명을 입력해 주세요.'); return }
    try {
      if (editing.id) await creatorApi.updateBooth(editing.id, editing)
      else await creatorApi.createBooth(editing)
      setEditing(null); await state.reload()
    } catch (caught) { setError(caught instanceof Error ? caught.message : '부스를 저장하지 못했습니다.') }
  }
  const remove = async (id: number) => {
    if (!window.confirm('연결된 예약과 판매가 없는 부스만 삭제할 수 있습니다. 삭제할까요?')) return
    try { await creatorApi.deleteBooth(id); await state.reload() } catch (caught) { setError(caught instanceof Error ? caught.message : '부스를 삭제하지 못했습니다.') }
  }
  return <><PageHeader eyebrow="Creator · Booths" title="내 부스 목록" description="여러 행사에서 재사용할 기본 부스 소개를 관리합니다." actions={<button className="btn primary" onClick={() => setEditing({ name: '', intro: '', snsUrl: '', imageKey: '', creatorName: '', boothNumber: '' })}>새 부스</button>} />{error && <div className="form-alert">{error}</div>}{editing && <form className="panel form-panel" onSubmit={(event) => void save(event)}><div className="panel-header"><h2>{editing.id ? '부스 수정' : '부스 등록'}</h2><button className="btn subtle" type="button" onClick={() => setEditing(null)}>닫기</button></div><div className="form-grid"><label className="field"><span>부스명</span><input className="input" required value={editing.name ?? ''} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label><label className="field"><span>SNS 주소</span><input className="input" type="url" placeholder="https://" value={editing.snsUrl ?? ''} onChange={(event) => setEditing({ ...editing, snsUrl: event.target.value })} /></label><ImageUploader target="booth" currentUrl={editing.imageUrl} onUploaded={(imageKey) => setEditing({ ...editing, imageKey })} /><label className="field full"><span>부스 소개</span><textarea className="textarea" rows={4} value={editing.intro ?? ''} onChange={(event) => setEditing({ ...editing, intro: event.target.value })} /></label></div><button className="btn primary">변경 저장</button></form>}{state.loading ? <LoadingState label="부스를 불러오고 있습니다" /> : state.error ? <ErrorState error={state.error} retry={() => void state.reload()} /> : !state.data?.length ? <EmptyState title="등록한 부스가 없습니다" description="행사 참가에 사용할 첫 부스를 만들어 보세요." /> : <div className="console-list">{state.data.map((booth) => <article className="list-row" key={booth.id}><div><StatusChip tone="muted">기본 정보</StatusChip><h2>{booth.name}</h2><p className="item-meta">{booth.intro || '부스 소개가 없습니다.'}</p></div><div className="row-actions"><button className="btn subtle" onClick={() => setEditing(booth)}>수정</button><button className="btn danger subtle" onClick={() => void remove(booth.id)}>삭제</button></div></article>)}</div>}<div className="section-heading compact"><div><p className="eyebrow">Approved Booths</p><h2>승인된 행사 부스</h2></div></div>{approved.loading ? <LoadingState label="승인된 부스를 불러오고 있습니다" /> : approved.error ? <ErrorState error={approved.error} retry={() => void approved.reload()} /> : !approved.data?.length ? <EmptyState title="승인된 행사 부스가 없습니다" description="행사 참가 신청이 승인되면 상품과 공지를 관리할 수 있습니다." /> : <div className="console-list">{approved.data.map((booth) => <article className="list-row" key={booth.id}><div><StatusChip tone={booth.status === 'APPROVED' ? 'active' : 'muted'}>{booth.status === 'APPROVED' ? '승인' : booth.status}</StatusChip><h2>{booth.name}</h2><p className="item-meta">부스 번호 {booth.boothNumber || '미정'}</p></div><div className="row-actions"><Link className="btn secondary" to={`/creator/event-booths/${booth.id}/products`}>상품</Link><Link className="btn secondary" to={`/creator/notices?booth=${booth.id}`}>공지</Link></div></article>)}</div>}</>
}

export function CreatorProductsPage() {
  const { eventBoothId = '' } = useParams()
  const state = useRemote(() => creatorApi.products(eventBoothId), [eventBoothId])
  const emptyProduct: Partial<EventProduct> = { name: '', description: '', imageKey: '', price: 0, stockMode: 'FINITE', stockQuantity: 0, soldOut: false, isPublic: true, reservationEnabled: true }
  const [editing, setEditing] = useState<Partial<EventProduct> | null>(null)
  const [error, setError] = useState('')
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!editing?.name?.trim()) { setError('상품명을 입력해 주세요.'); return }
    if ((editing.price ?? 0) < 0 || (editing.stockMode === 'FINITE' && (editing.stockQuantity ?? -1) < 0)) { setError('가격과 재고는 0 이상이어야 합니다.'); return }
    try { if (editing.id) await creatorApi.updateProduct(editing.id, editing); else await creatorApi.saveProduct(eventBoothId, editing); setEditing(null); await state.reload() } catch (caught) { setError(caught instanceof Error ? caught.message : '상품을 저장하지 못했습니다.') }
  }
  const remove = async (id: number) => { if (!window.confirm('이 상품을 삭제할까요?')) return; try { await creatorApi.deleteProduct(id); await state.reload() } catch (caught) { setError(caught instanceof Error ? caught.message : '상품을 삭제하지 못했습니다.') } }
  const copy = async () => { try { await creatorApi.copyProducts(eventBoothId, []); await state.reload() } catch (caught) { setError(caught instanceof Error ? caught.message : '이전 상품을 불러오지 못했습니다.') } }
  return <><PageHeader eyebrow="Creator · Products" title="상품/재고 관리" description="통합 재고 하나와 예약·공개·SOLD OUT 상태를 관리합니다." actions={<><button className="btn secondary" onClick={() => void copy()}>이전 상품 불러오기</button><button className="btn primary" onClick={() => setEditing(emptyProduct)}>상품 등록</button></>} />{error && <div className="form-alert">{error}</div>}{editing && <form className="panel form-panel" onSubmit={(event) => void save(event)}><div className="panel-header"><h2>상품 등록/수정</h2><button className="btn subtle" type="button" onClick={() => setEditing(null)}>닫기</button></div><div className="form-grid"><label className="field"><span>상품명</span><input className="input" required value={editing.name ?? ''} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label><label className="field"><span>가격</span><input className="input" type="number" min="0" value={editing.price ?? 0} onChange={(event) => setEditing({ ...editing, price: Number(event.target.value) })} /></label><label className="field"><span>재고 방식</span><select className="select" value={editing.stockMode} onChange={(event) => setEditing({ ...editing, stockMode: event.target.value as EventProduct['stockMode'] })}><option value="FINITE">유한 재고</option><option value="INFINITE">무한 재고</option></select></label>{editing.stockMode === 'FINITE' && <label className="field"><span>현재 재고</span><input className="input" type="number" min="0" value={editing.stockQuantity ?? 0} onChange={(event) => setEditing({ ...editing, stockQuantity: Number(event.target.value) })} /></label>}<ImageUploader target="product" currentUrl={editing.imageUrl} onUploaded={(imageKey) => setEditing({ ...editing, imageKey })} /><label className="field full"><span>상품 설명</span><textarea className="textarea" rows={4} value={editing.description ?? ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></label><label className="check-field"><input type="checkbox" checked={editing.reservationEnabled ?? false} onChange={(event) => setEditing({ ...editing, reservationEnabled: event.target.checked })} /> 예약 가능</label><label className="check-field"><input type="checkbox" checked={editing.isPublic ?? false} onChange={(event) => setEditing({ ...editing, isPublic: event.target.checked })} /> 공개</label><label className="check-field"><input type="checkbox" checked={editing.soldOut ?? false} onChange={(event) => setEditing({ ...editing, soldOut: event.target.checked })} /> SOLD OUT</label></div><button className="btn primary">상품 저장</button></form>}{state.loading ? <LoadingState label="상품을 불러오고 있습니다" /> : state.error ? <ErrorState error={state.error} retry={() => void state.reload()} /> : !state.data?.length ? <EmptyState title="등록한 상품이 없습니다" description="새 상품을 등록하거나 이전 행사 상품을 불러오세요." /> : <div className="table-wrap"><table><thead><tr><th>상품</th><th>가격</th><th>현재 재고</th><th>예약</th><th>상태</th><th>관리</th></tr></thead><tbody>{state.data.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small>{product.description}</small></td><td>{formatPrice(product.price)}</td><td>{product.stockMode === 'INFINITE' ? '무한' : `${product.stockQuantity ?? 0}개`}</td><td>{product.reservationEnabled ? '가능' : '불가'}</td><td><StatusChip tone={product.soldOut ? 'warning' : product.isPublic ? 'active' : 'muted'}>{product.soldOut ? 'SOLD OUT' : product.isPublic ? '공개' : '숨김'}</StatusChip></td><td><div className="row-actions"><button className="btn subtle" onClick={() => setEditing(product)}>수정</button><button className="btn danger subtle" onClick={() => void remove(product.id)}>삭제</button></div></td></tr>)}</tbody></table></div>}</>
}

export function CreatorReservationsPage() {
  const state = useRemote(creatorApi.reservations, [])
  const [query, setQuery] = useState('')
  const [found, setFound] = useState<Awaited<ReturnType<typeof creatorApi.reservationByNumber>> | null>(null)
  const [message, setMessage] = useState('')
  const search = async (event: FormEvent) => { event.preventDefault(); setMessage(''); try { setFound(await creatorApi.reservationByNumber(query)) } catch (caught) { setFound(null); setMessage(caught instanceof Error ? caught.message : '예약을 찾지 못했습니다.') } }
  const pickup = async (id: number) => { if (!window.confirm('상품을 전달하고 수령 완료로 변경할까요?')) return; try { setFound(await creatorApi.pickup(id)); await state.reload() } catch (caught) { setMessage(caught instanceof Error ? caught.message : '수령 처리하지 못했습니다.') } }
  return <><PageHeader eyebrow="Creator · Reservations" title="예약번호 검색/수령 처리" description="팬이 보여주는 예약번호를 검색하고 상품 전달 후 수령 완료 처리합니다." /><form className="search-panel" onSubmit={(event) => void search(event)}><input className="input" required value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: RSV-260718-042" aria-label="예약번호 검색" /><button className="btn primary">검색</button></form>{message && <div className="form-alert">{message}</div>}{found && <article className="panel pickup-card"><div><p className="eyebrow mono">{found.reservationNo}</p><h2>{found.boothName}</h2><p>{found.items.map((item) => `${item.productName ?? item.eventProductId} × ${item.quantity}`).join(', ')}</p></div><div className="row-actions"><StatusChip tone={found.status === 'RESERVED' ? 'active' : 'muted'}>{found.status === 'RESERVED' ? '예약' : found.status === 'PICKED_UP' ? '수령 완료' : '취소'}</StatusChip><button className="btn primary" disabled={found.status !== 'RESERVED'} onClick={() => void pickup(found.id)}>수령 완료 처리</button></div></article>}<div className="section-heading compact"><div><h2>예약 목록</h2></div></div>{state.loading ? <LoadingState label="예약을 불러오고 있습니다" /> : state.error ? <ErrorState error={state.error} retry={() => void state.reload()} /> : !state.data?.length ? <EmptyState title="예약이 없습니다" description="팬의 예약이 생성되면 이곳에 표시됩니다." /> : <div className="table-wrap"><table><thead><tr><th>예약번호</th><th>행사</th><th>부스</th><th>상품</th><th>상태</th></tr></thead><tbody>{state.data.map((item) => <tr key={item.id}><td className="mono">{item.reservationNo}</td><td>{item.eventName}</td><td>{item.boothName}</td><td>{item.items.length}종</td><td>{item.status}</td></tr>)}</tbody></table></div>}</>
}

export function CreatorPosPage() {
  const booths = useRemote(creatorApi.eventBooths, [])
  const events = useRemote(creatorApi.events, [])
  const sales = useRemote(creatorApi.posSales, [])
  const [params, setParams] = useSearchParams()
  const selectedBooth = params.get('booth') || String(booths.data?.[0]?.id ?? '')
  const products = useRemote(() => selectedBooth ? creatorApi.products(selectedBooth) : Promise.resolve([]), [selectedBooth])
  const [cart, setCart] = useState<Record<number, number>>({})
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [message, setMessage] = useState('')
  const items = useMemo(() => (products.data ?? []).filter((product) => (cart[product.id] ?? 0) > 0), [products.data, cart])
  const total = items.reduce((sum, product) => sum + product.price * cart[product.id], 0)
  const sell = async () => { setMessage(''); if (!items.length) { setMessage('판매 상품을 선택해 주세요.'); return } try { const lines: ReservationItem[] = items.map((item) => ({ eventProductId: item.id, quantity: cart[item.id] })); await creatorApi.createPosSale(Number(selectedBooth), paymentMethod, lines); setCart({}); await sales.reload(); await products.reload(); setMessage('판매 기록을 저장했습니다.') } catch (caught) { setMessage(caught instanceof Error ? caught.message : '판매를 저장하지 못했습니다.') } }
  const cancel = async (id: number) => { if (!window.confirm('판매 기록을 취소할까요? 재고는 자동 복구되지 않습니다.')) return; try { await creatorApi.cancelPosSale(id); await sales.reload() } catch (caught) { setMessage(caught instanceof Error ? caught.message : '판매를 취소하지 못했습니다.') } }
  return <><PageHeader eyebrow="Creator · POS" title="부스 POS" description="현장 판매를 간단히 기록합니다. 실제 결제는 별도로 진행하세요." /><div className="filter-bar"><select className="select" value={selectedBooth} onChange={(event) => setParams({ booth: event.target.value })}>{booths.data?.map((booth) => <option value={booth.id} key={booth.id}>{eventBoothLabel(booth, events.data)}</option>)}</select></div>{message && <div className="notice-banner">{message}</div>}<div className="pos-layout"><div><h2>상품 선택</h2>{products.loading ? <LoadingState /> : products.error ? <ErrorState error={products.error} /> : <div className="pos-products">{products.data?.filter((item) => item.isPublic).map((product) => <button className="pos-product" disabled={product.soldOut} key={product.id} onClick={() => setCart((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }))}><StatusChip tone={product.soldOut ? 'warning' : 'active'}>{product.soldOut ? '품절' : product.stockMode === 'FINITE' ? `재고 ${product.stockQuantity}` : '판매중'}</StatusChip><strong>{product.name}</strong><span>{formatPrice(product.price)}</span></button>)}</div>}</div><aside className="panel pos-cart"><h2>판매 카트</h2>{items.length ? items.map((item) => <div className="summary-row" key={item.id}><span>{item.name} × {cart[item.id]}</span><button className="btn subtle" onClick={() => setCart((current) => ({ ...current, [item.id]: Math.max(0, current[item.id] - 1) }))}>−</button></div>) : <p className="empty-copy">판매할 상품을 선택하세요.</p>}<label className="field"><span>결제수단 메모</span><select className="select" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="CASH">현금</option><option value="TRANSFER">계좌이체</option><option value="OTHER">기타</option></select></label><div className="summary-total"><span>합계</span><strong>{formatPrice(total)}</strong></div><button className="btn primary wide" onClick={() => void sell()}>판매 기록</button></aside></div><div className="section-heading compact"><h2>최근 판매</h2></div>{sales.loading ? <LoadingState /> : sales.error ? <ErrorState error={sales.error} /> : !sales.data?.length ? <EmptyState title="판매 기록이 없습니다" description="POS에서 저장한 판매가 여기에 표시됩니다." /> : <div className="table-wrap"><table><thead><tr><th>판매번호</th><th>결제수단</th><th>금액</th><th>상태</th><th>관리</th></tr></thead><tbody>{sales.data.map((sale) => <tr key={sale.id}><td>{sale.saleNo}</td><td>{sale.paymentMethod}</td><td>{formatPrice(sale.totalAmount)}</td><td>{sale.status}</td><td><button className="btn danger subtle" disabled={sale.status === 'CANCELED'} onClick={() => void cancel(sale.id)}>취소</button></td></tr>)}</tbody></table></div>}</>
}

export function CreatorNoticesPage() {
  const booths = useRemote(creatorApi.eventBooths, [])
  const events = useRemote(creatorApi.events, [])
  const [params, setParams] = useSearchParams()
  const selectedBooth = params.get('booth') || String(booths.data?.[0]?.id ?? '')
  const state = useRemote(() => selectedBooth ? creatorApi.notices(selectedBooth) : Promise.resolve([]), [selectedBooth])
  const [editing, setEditing] = useState<Partial<BoothNotice>>({ title: '', body: '', pinned: false })
  const [message, setMessage] = useState('')
  const save = async (event: FormEvent) => { event.preventDefault(); setMessage(''); try { if (editing.id) await creatorApi.updateNotice(editing.id, editing); else await creatorApi.saveNotice(selectedBooth, editing); setEditing({ title: '', body: '', pinned: false }); await state.reload() } catch (caught) { setMessage(caught instanceof Error ? caught.message : '공지를 저장하지 못했습니다.') } }
  const remove = async (id: number) => { if (!window.confirm('공지를 삭제할까요?')) return; try { await creatorApi.deleteNotice(id); await state.reload() } catch (caught) { setMessage(caught instanceof Error ? caught.message : '공지를 삭제하지 못했습니다.') } }
  return <><PageHeader eyebrow="Creator · Notices" title="공지 관리" description="현장 변경 사항을 작성하고 한 개를 부스 상단에 고정합니다." /><div className="filter-bar"><select className="select" value={selectedBooth} onChange={(event) => setParams({ booth: event.target.value })}>{booths.data?.map((booth) => <option value={booth.id} key={booth.id}>{eventBoothLabel(booth, events.data)}</option>)}</select></div>{message && <div className="form-alert">{message}</div>}<div className="split-layout"><form className="panel form-panel" onSubmit={(event) => void save(event)}><h2>공지 등록/수정</h2><label className="field"><span>제목</span><input className="input" required value={editing.title ?? ''} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label><label className="field"><span>내용</span><textarea className="textarea" required rows={6} value={editing.body ?? ''} onChange={(event) => setEditing({ ...editing, body: event.target.value })} /></label><label className="check-field"><input type="checkbox" checked={editing.pinned ?? false} onChange={(event) => setEditing({ ...editing, pinned: event.target.checked })} /> 부스 상단 고정</label><button className="btn primary">공지 저장</button></form><div><h2>공지 목록</h2>{state.loading ? <LoadingState /> : state.error ? <ErrorState error={state.error} /> : !state.data?.length ? <EmptyState title="등록한 공지가 없습니다" description="현장 안내가 생기면 공지를 작성하세요." /> : <div className="console-list">{state.data.map((notice) => <article className="list-row notice-row" key={notice.id}><div>{notice.pinned && <StatusChip tone="warning">상단 고정</StatusChip>}<h3>{notice.title}</h3><p>{notice.body}</p></div><div className="row-actions">{!notice.pinned && <button className="btn secondary" onClick={() => void creatorApi.pinNotice(notice.id).then(state.reload)}>고정</button>}<button className="btn subtle" onClick={() => setEditing(notice)}>수정</button><button className="btn danger subtle" onClick={() => void remove(notice.id)}>삭제</button></div></article>)}</div>}</div></div></>
}
