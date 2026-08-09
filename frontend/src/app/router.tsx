import { createBrowserRouter, Navigate } from 'react-router'
import { PublicLayout } from '../components/layout/PublicLayout'
import { ConsoleLayout } from '../components/layout/ConsoleLayout'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { BoothDetailPage, EventDetailPage, EventsPage, ProductDetailPage } from '../pages/PublicPages'
import { ReservationCreatePage, ReservationDetailPage, ReservationsPage } from '../pages/ReservationPages'
import { CreatorBoothsPage, CreatorEventsPage, CreatorHomePage, CreatorNoticesPage, CreatorPosPage, CreatorProductsPage, CreatorReservationsPage } from '../pages/CreatorPages'
import { AdminApplicationsPage, AdminEventFormPage, AdminEventsPage } from '../pages/AdminPages'
import { EmptyState } from '../components/ui/States'

export const router = createBrowserRouter([
  { path: '/', element: <PublicLayout />, children: [
    { index: true, element: <HomePage /> },
    { path: 'login', element: <LoginPage /> },
    { path: 'events', element: <EventsPage /> },
    { path: 'events/:eventId', element: <EventDetailPage /> },
    { path: 'booths/:boothId', element: <BoothDetailPage /> },
    { path: 'booths/:boothId/reserve', element: <ReservationCreatePage /> },
    { path: 'products/:productId', element: <ProductDetailPage /> },
    { path: 'reservations', element: <ReservationsPage /> },
    { path: 'reservations/:reservationId', element: <ReservationDetailPage /> },
  ] },
  { path: '/creator', element: <ConsoleLayout role="CREATOR" />, children: [
    { index: true, element: <CreatorHomePage /> },
    { path: 'events', element: <CreatorEventsPage /> },
    { path: 'booths', element: <CreatorBoothsPage /> },
    { path: 'event-booths/:eventBoothId/products', element: <CreatorProductsPage /> },
    { path: 'reservations', element: <CreatorReservationsPage /> },
    { path: 'pos', element: <CreatorPosPage /> },
    { path: 'notices', element: <CreatorNoticesPage /> },
  ] },
  { path: '/admin', element: <ConsoleLayout role="ADMIN" />, children: [
    { index: true, element: <Navigate to="events" replace /> },
    { path: 'events', element: <AdminEventsPage /> },
    { path: 'events/:eventId', element: <AdminEventFormPage /> },
    { path: 'applications', element: <AdminApplicationsPage /> },
  ] },
  { path: '*', element: <section className="section-pad"><EmptyState title="페이지를 찾을 수 없습니다" description="주소를 확인하거나 팬 홈으로 돌아가 주세요." /></section> },
])
