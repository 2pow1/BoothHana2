import { api } from './client'
import type {
  BoothNotice,
  BoothSummary,
  EventApplication,
  EventProduct,
  EventSummary,
  PosSale,
  Reservation,
  ReservationItem,
  User,
} from '../types'

export const authApi = {
  me: () => api<User>('/api/me'),
  logout: () => api<void>('/api/logout', { method: 'POST' }),
}

export const publicApi = {
  events: () => api<EventSummary[]>('/api/public/events'),
  event: (id: string) => api<EventSummary>(`/api/public/events/${id}`),
  eventBooths: (id: string) => api<BoothSummary[]>(`/api/public/events/${id}/booths`),
  booth: (id: string) => api<BoothSummary>(`/api/public/booths/${id}`),
  products: (id: string) => api<EventProduct[]>(`/api/public/booths/${id}/products`),
  product: (id: string) => api<EventProduct>(`/api/public/products/${id}`),
}

export const reservationApi = {
  list: () => api<Reservation[]>('/api/me/reservations'),
  detail: (id: string) => api<Reservation>(`/api/me/reservations/${id}`),
  create: (eventBoothId: number, items: ReservationItem[]) =>
    api<Reservation>('/api/me/reservations', {
      method: 'POST',
      body: JSON.stringify({ eventBoothId, items }),
    }),
  cancel: (id: number) => api<Reservation>(`/api/me/reservations/${id}/cancel`, { method: 'POST' }),
}

export const creatorApi = {
  events: () => api<EventSummary[]>('/api/creator/events'),
  booths: () => api<BoothSummary[]>('/api/creator/booths'),
  eventBooths: () => api<BoothSummary[]>('/api/creator/event-booths'),
  updateEventBooth: (id: number, body: Pick<BoothSummary, 'boothNumber' | 'intro' | 'isPublic'>) =>
    api<BoothSummary>(`/api/creator/event-booths/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteEventBooth: (id: number) => api<void>(`/api/creator/event-booths/${id}`, { method: 'DELETE' }),
  createBooth: (body: Partial<BoothSummary>) =>
    api<BoothSummary>('/api/creator/booths', { method: 'POST', body: JSON.stringify(body) }),
  updateBooth: (id: number, body: Partial<BoothSummary>) =>
    api<BoothSummary>(`/api/creator/booths/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteBooth: (id: number) => api<void>(`/api/creator/booths/${id}`, { method: 'DELETE' }),
  apply: (eventId: number, boothId: number) =>
    api<EventApplication>('/api/creator/applications', {
      method: 'POST',
      body: JSON.stringify({ eventId, boothId }),
    }),
  products: (eventBoothId: string) => api<EventProduct[]>(`/api/creator/event-booths/${eventBoothId}/products`),
  saveProduct: (eventBoothId: string, body: Partial<EventProduct>) =>
    api<EventProduct>(`/api/creator/event-booths/${eventBoothId}/products`, { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id: number, body: Partial<EventProduct>) =>
    api<EventProduct>(`/api/creator/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteProduct: (id: number) => api<void>(`/api/creator/products/${id}`, { method: 'DELETE' }),
  copyProducts: (eventBoothId: string, productIds: number[]) =>
    api<EventProduct[]>(`/api/creator/event-booths/${eventBoothId}/products/copy`, {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    }),
  reservations: () => api<Reservation[]>('/api/creator/reservations'),
  reservationByNumber: (value: string) => api<Reservation>(`/api/creator/reservations/by-number/${encodeURIComponent(value)}`),
  pickup: (id: number) => api<Reservation>(`/api/creator/reservations/${id}/pickup`, { method: 'POST' }),
  posSales: () => api<PosSale[]>('/api/creator/pos-sales'),
  posSale: (id: number) => api<PosSale>(`/api/creator/pos-sales/${id}`),
  createPosSale: (eventBoothId: number, paymentMethod: string, items: ReservationItem[]) =>
    api<PosSale>('/api/creator/pos-sales', { method: 'POST', body: JSON.stringify({ eventBoothId, paymentMethod, items }) }),
  cancelPosSale: (id: number) => api<PosSale>(`/api/creator/pos-sales/${id}/cancel`, { method: 'POST' }),
  notices: (eventBoothId: string) => api<BoothNotice[]>(`/api/creator/event-booths/${eventBoothId}/notices`),
  saveNotice: (eventBoothId: string, body: Partial<BoothNotice>) =>
    api<BoothNotice>(`/api/creator/event-booths/${eventBoothId}/notices`, { method: 'POST', body: JSON.stringify(body) }),
  updateNotice: (id: number, body: Partial<BoothNotice>) =>
    api<BoothNotice>(`/api/creator/notices/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteNotice: (id: number) => api<void>(`/api/creator/notices/${id}`, { method: 'DELETE' }),
  pinNotice: (id: number) => api<BoothNotice>(`/api/creator/notices/${id}/pin`, { method: 'POST' }),
}

export const adminApi = {
  events: () => api<EventSummary[]>('/api/admin/events'),
  event: (id: string) => api<EventSummary>(`/api/admin/events/${id}`),
  createEvent: (body: Partial<EventSummary>) =>
    api<EventSummary>('/api/admin/events', { method: 'POST', body: JSON.stringify(body) }),
  updateEvent: (id: number, body: Partial<EventSummary>) =>
    api<EventSummary>(`/api/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteEvent: (id: number) => api<void>(`/api/admin/events/${id}`, { method: 'DELETE' }),
  publishEvent: (id: number) => api<EventSummary>(`/api/admin/events/${id}/publish`, { method: 'POST' }),
  endEvent: (id: number) => api<EventSummary>(`/api/admin/events/${id}/end`, { method: 'POST' }),
  applications: () => api<EventApplication[]>('/api/admin/applications'),
  approve: (id: number) => api<EventApplication>(`/api/admin/applications/${id}/approve`, { method: 'POST' }),
  reject: (id: number, reason: string) =>
    api<EventApplication>(`/api/admin/applications/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
}

export const uploadApi = {
  async image(file: File, target: 'booth' | 'product'): Promise<string> {
    const signed = await api<{ uploadUrl: string; objectKey: string }>('/api/creator/uploads/presign', {
      method: 'POST',
      body: JSON.stringify({ fileName: file.name, contentType: file.type, target }),
    })
    const response = await fetch(signed.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      const errorCode = detail.match(/<Code>([^<]+)<\/Code>/)?.[1]
      throw new Error(`이미지 업로드 실패 (${response.status}${errorCode ? `/${errorCode}` : ''})`)
    }
    return signed.objectKey
  },
}
