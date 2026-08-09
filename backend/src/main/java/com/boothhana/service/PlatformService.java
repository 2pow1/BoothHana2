package com.boothhana.service;

import com.boothhana.api.ApiException;
import com.boothhana.api.ApiModels.*;
import com.boothhana.domain.*;
import com.boothhana.domain.DomainEnums.*;
import com.boothhana.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class PlatformService {
    private final UserAccountRepository users;
    private final EventRepository events;
    private final BoothRepository booths;
    private final EventBoothRepository eventBooths;
    private final ProductRepository products;
    private final EventProductRepository eventProducts;
    private final BoothNoticeRepository notices;
    private final ReservationRepository reservations;
    private final ReservationItemRepository reservationItems;
    private final PosSaleRepository posSales;
    private final PosSaleItemRepository posItems;
    private final String publicImageUrl;

    public PlatformService(UserAccountRepository users, EventRepository events, BoothRepository booths,
            EventBoothRepository eventBooths, ProductRepository products, EventProductRepository eventProducts,
            BoothNoticeRepository notices, ReservationRepository reservations, ReservationItemRepository reservationItems,
            PosSaleRepository posSales, PosSaleItemRepository posItems,
            @Value("${app.r2.public-url:}") String publicImageUrl) {
        this.users = users; this.events = events; this.booths = booths; this.eventBooths = eventBooths;
        this.products = products; this.eventProducts = eventProducts; this.notices = notices;
        this.reservations = reservations; this.reservationItems = reservationItems;
        this.posSales = posSales; this.posItems = posItems; this.publicImageUrl = publicImageUrl;
    }

    public UserView user(UserAccount user, List<Permission> permissions) { return new UserView(user.id, user.displayName, permissions); }

    public List<EventView> publicEvents() {
        List<Event> result = new ArrayList<>(events.findByStatusOrderByStartAtAsc(EventStatus.PUBLISHED));
        result.addAll(events.findByStatusOrderByStartAtAsc(EventStatus.ENDED));
        return result.stream().map(this::eventView).toList();
    }
    public EventView publicEvent(Long id) {
        Event event = requireEvent(id);
        if (event.status == EventStatus.DRAFT) throw ApiException.notFound("공개된 행사를 찾을 수 없습니다.");
        return eventView(event);
    }
    public List<BoothView> publicEventBooths(Long eventId) {
        publicEvent(eventId);
        return eventBooths.findByEventIdAndStatusAndIsPublicTrue(eventId, ApplicationStatus.APPROVED).stream().map(this::boothView).toList();
    }
    public BoothView publicBooth(Long id) { return boothView(requirePublicEventBooth(id)); }
    public List<ProductView> publicProducts(Long eventBoothId) {
        requirePublicEventBooth(eventBoothId);
        return eventProducts.findByEventBoothIdAndIsPublicTrueOrderByIdDesc(eventBoothId).stream().map(this::productView).toList();
    }
    public ProductView publicProduct(Long id) {
        EventProduct value = eventProducts.findById(id).orElseThrow(() -> ApiException.notFound("상품을 찾을 수 없습니다."));
        if (!value.isPublic) throw ApiException.notFound("상품을 찾을 수 없습니다.");
        requirePublicEventBooth(value.eventBoothId);
        return productView(value);
    }

    public List<EventView> creatorEvents() { return events.findAllByOrderByStartAtDesc().stream().map(this::eventView).toList(); }
    public List<BoothView> creatorBooths(UserAccount owner) { return booths.findByOwnerUserIdOrderByIdDesc(owner.id).stream().map(this::basicBoothView).toList(); }
    public List<BoothView> creatorEventBooths(UserAccount owner) {
        List<Long> ids = booths.findByOwnerUserIdOrderByIdDesc(owner.id).stream().map(value -> value.id).toList();
        if (ids.isEmpty()) return List.of();
        return eventBooths.findByBoothIdIn(ids).stream().map(this::boothView).toList();
    }
    @Transactional
    public BoothView createBooth(UserAccount owner, BoothInput input) {
        Booth booth = new Booth(); booth.ownerUserId = owner.id; apply(booth, input); return basicBoothView(booths.save(booth));
    }
    @Transactional
    public BoothView updateBooth(UserAccount owner, Long id, BoothInput input) {
        Booth booth = requireOwnedBooth(owner, id); apply(booth, input); return basicBoothView(booths.save(booth));
    }
    @Transactional
    public void deleteBooth(UserAccount owner, Long id) {
        Booth booth = requireOwnedBooth(owner, id);
        List<EventBooth> linked = eventBooths.findByBoothIdIn(List.of(id));
        boolean used = linked.stream().anyMatch(value -> reservations.countByEventBoothId(value.id) > 0 || posSales.countByEventBoothId(value.id) > 0);
        if (used) throw ApiException.conflict("예약 또는 판매가 연결된 부스는 삭제할 수 없습니다.");
        linked.forEach(value -> { eventProducts.deleteAll(eventProducts.findByEventBoothIdOrderByIdDesc(value.id)); notices.deleteAll(notices.findByEventBoothIdOrderByPinnedDescCreatedAtDesc(value.id)); });
        eventBooths.deleteAll(linked); products.deleteAll(products.findByBoothIdOrderByIdDesc(id)); booths.delete(booth);
    }
    @Transactional
    public ApplicationView applyToEvent(UserAccount owner, ApplicationInput input) {
        Event event = requireEvent(input.eventId());
        if (event.status != EventStatus.PUBLISHED) throw ApiException.conflict("현재 참가 신청을 받는 행사가 아닙니다.");
        Booth booth = requireOwnedBooth(owner, input.boothId());
        if (eventBooths.findByEventIdAndBoothId(event.id, booth.id).isPresent()) throw ApiException.conflict("이미 참가 신청한 행사입니다.");
        EventBooth value = new EventBooth(); value.eventId = event.id; value.boothId = booth.id; value.intro = booth.description;
        return applicationView(eventBooths.save(value));
    }

    public List<ProductView> creatorProducts(UserAccount owner, Long eventBoothId) {
        requireOwnedEventBooth(owner, eventBoothId);
        return eventProducts.findByEventBoothIdOrderByIdDesc(eventBoothId).stream().map(this::productView).toList();
    }
    @Transactional
    public ProductView createProduct(UserAccount owner, Long eventBoothId, ProductInput input) {
        EventBooth eventBooth = requireMutableOwnedEventBooth(owner, eventBoothId);
        Product product = new Product(); product.boothId = eventBooth.boothId; product.name = input.name(); product.description = text(input.description()); product.imageKey = input.imageKey();
        product = products.save(product);
        EventProduct value = new EventProduct(); value.eventBoothId = eventBooth.id; value.productId = product.id; apply(value, input);
        return productView(eventProducts.save(value));
    }
    @Transactional
    public ProductView updateProduct(UserAccount owner, Long id, ProductInput input) {
        EventProduct value = requireOwnedEventProduct(owner, id); requireMutableOwnedEventBooth(owner, value.eventBoothId);
        Product product = products.findById(value.productId).orElseThrow(); product.name = input.name(); product.description = text(input.description()); product.imageKey = input.imageKey(); products.save(product);
        apply(value, input); return productView(eventProducts.save(value));
    }
    @Transactional
    public void deleteProduct(UserAccount owner, Long id) {
        EventProduct value = requireOwnedEventProduct(owner, id); requireMutableOwnedEventBooth(owner, value.eventBoothId);
        if (reservationItems.countByEventProductId(id) > 0 || posItems.countByEventProductId(id) > 0) throw ApiException.conflict("예약 또는 판매가 연결된 상품은 삭제할 수 없습니다.");
        Long productId = value.productId; eventProducts.delete(value);
        if (eventProducts.countByProductId(productId) == 0) products.deleteById(productId);
    }
    @Transactional
    public List<ProductView> copyProducts(UserAccount owner, Long eventBoothId, CopyProductsInput input) {
        EventBooth target = requireMutableOwnedEventBooth(owner, eventBoothId);
        Set<Long> requested = input.productIds() == null ? Set.of() : new HashSet<>(input.productIds());
        Set<Long> existing = eventProducts.findByEventBoothIdOrderByIdDesc(eventBoothId).stream().map(value -> value.productId).collect(java.util.stream.Collectors.toSet());
        List<Product> candidates = products.findByBoothIdOrderByIdDesc(target.boothId).stream().filter(value -> !existing.contains(value.id)).filter(value -> requested.isEmpty() || requested.contains(value.id)).toList();
        for (Product product : candidates) { EventProduct value = new EventProduct(); value.eventBoothId = target.id; value.productId = product.id; value.price = 0; value.stockMode = StockMode.FINITE; value.stockQuantity = 0; value.isPublic = false; value.reservationEnabled = false; eventProducts.save(value); }
        return creatorProducts(owner, eventBoothId);
    }

    public List<NoticeView> creatorNotices(UserAccount owner, Long eventBoothId) { requireOwnedEventBooth(owner, eventBoothId); return notices.findByEventBoothIdOrderByPinnedDescCreatedAtDesc(eventBoothId).stream().map(this::noticeView).toList(); }
    @Transactional
    public NoticeView createNotice(UserAccount owner, Long eventBoothId, NoticeInput input) {
        requireMutableOwnedEventBooth(owner, eventBoothId); if (input.pinned()) unpinAll(eventBoothId, null);
        BoothNotice value = new BoothNotice(); value.eventBoothId = eventBoothId; apply(value, input); return noticeView(notices.save(value));
    }
    @Transactional
    public NoticeView updateNotice(UserAccount owner, Long id, NoticeInput input) {
        BoothNotice value = requireNotice(id); requireMutableOwnedEventBooth(owner, value.eventBoothId); if (input.pinned()) unpinAll(value.eventBoothId, id); apply(value, input); return noticeView(notices.save(value));
    }
    @Transactional
    public NoticeView pinNotice(UserAccount owner, Long id) { BoothNotice value = requireNotice(id); requireMutableOwnedEventBooth(owner, value.eventBoothId); unpinAll(value.eventBoothId, id); value.pinned = true; return noticeView(notices.save(value)); }
    @Transactional
    public void deleteNotice(UserAccount owner, Long id) { BoothNotice value = requireNotice(id); requireMutableOwnedEventBooth(owner, value.eventBoothId); notices.delete(value); }

    @Transactional
    public ReservationView createReservation(UserAccount user, ReservationInput input) {
        EventBooth eventBooth = requirePublicEventBooth(input.eventBoothId()); Event event = requireEvent(eventBooth.eventId);
        if (event.status != EventStatus.PUBLISHED) throw ApiException.conflict("종료된 행사에는 새 예약을 만들 수 없습니다.");
        if (input.items().stream().map(LineInput::eventProductId).distinct().count() != input.items().size()) throw ApiException.badRequest("같은 상품을 중복 선택할 수 없습니다.");
        List<EventProduct> selected = input.items().stream().map(line -> eventProducts.findById(line.eventProductId()).orElseThrow(() -> ApiException.notFound("상품을 찾을 수 없습니다."))).toList();
        for (int index = 0; index < selected.size(); index++) { EventProduct item = selected.get(index); LineInput line = input.items().get(index); if (!Objects.equals(item.eventBoothId, eventBooth.id) || !item.isPublic || !item.reservationEnabled || item.soldOut) throw ApiException.conflict("예약할 수 없는 상품이 포함되어 있습니다."); decrement(item, line.quantity()); }
        Reservation reservation = new Reservation(); reservation.userId = user.id; reservation.eventBoothId = eventBooth.id; reservation.reservationNo = number("RSV"); reservation.qrToken = reservation.reservationNo; reservation = reservations.save(reservation);
        for (int index = 0; index < selected.size(); index++) { EventProduct product = selected.get(index); ReservationItem line = new ReservationItem(); line.reservationId = reservation.id; line.eventProductId = product.id; line.quantity = input.items().get(index).quantity(); line.unitPrice = product.price; reservationItems.save(line); }
        return reservationView(reservation);
    }
    public List<ReservationView> userReservations(UserAccount user) { return reservations.findByUserIdOrderByCreatedAtDesc(user.id).stream().map(this::reservationView).toList(); }
    public ReservationView userReservation(UserAccount user, Long id) { Reservation value = requireReservation(id); if (!Objects.equals(value.userId, user.id)) throw ApiException.forbidden("다른 사용자의 예약은 볼 수 없습니다."); return reservationView(value); }
    @Transactional
    public ReservationView cancelReservation(UserAccount user, Long id) {
        Reservation value = requireReservation(id); if (!Objects.equals(value.userId, user.id)) throw ApiException.forbidden("다른 사용자의 예약을 취소할 수 없습니다.");
        if (value.status == ReservationStatus.CANCELED) return reservationView(value);
        if (value.status == ReservationStatus.PICKED_UP) throw ApiException.conflict("수령 완료된 예약은 취소할 수 없습니다.");
        for (ReservationItem line : reservationItems.findByReservationId(id)) increment(eventProducts.findById(line.eventProductId).orElseThrow(), line.quantity);
        value.status = ReservationStatus.CANCELED; value.canceledAt = Instant.now(); return reservationView(reservations.save(value));
    }

    public List<ReservationView> creatorReservations(UserAccount owner) { List<Long> ids = ownedEventBoothIds(owner); if (ids.isEmpty()) return List.of(); return reservations.findByEventBoothIdInOrderByCreatedAtDesc(ids).stream().map(this::reservationView).toList(); }
    public ReservationView creatorReservationByNumber(UserAccount owner, String number) { Reservation value = reservations.findByReservationNo(number).orElseThrow(() -> ApiException.notFound("예약번호를 찾을 수 없습니다.")); if (!ownedEventBoothIds(owner).contains(value.eventBoothId)) throw ApiException.forbidden("다른 부스의 예약입니다."); return reservationView(value); }
    @Transactional
    public ReservationView pickup(UserAccount owner, Long id) { Reservation value = requireReservation(id); if (!ownedEventBoothIds(owner).contains(value.eventBoothId)) throw ApiException.forbidden("다른 부스의 예약입니다."); if (value.status == ReservationStatus.RESERVED) { value.status = ReservationStatus.PICKED_UP; value.pickedUpAt = Instant.now(); value = reservations.save(value); } return reservationView(value); }

    public List<PosView> posSales(UserAccount owner) { List<Long> ids = ownedEventBoothIds(owner); if (ids.isEmpty()) return List.of(); return posSales.findByEventBoothIdInOrderBySoldAtDesc(ids).stream().map(this::posView).toList(); }
    @Transactional
    public PosView createPos(UserAccount owner, PosInput input) {
        requireMutableOwnedEventBooth(owner, input.eventBoothId());
        List<EventProduct> selected = input.items().stream().map(line -> requireOwnedEventProduct(owner, line.eventProductId())).toList();
        for (int i = 0; i < selected.size(); i++) { EventProduct product = selected.get(i); if (!Objects.equals(product.eventBoothId, input.eventBoothId()) || product.soldOut) throw ApiException.conflict("판매할 수 없는 상품이 포함되어 있습니다."); decrement(product, input.items().get(i).quantity()); }
        PosSale sale = new PosSale(); sale.eventBoothId = input.eventBoothId(); sale.paymentMethod = input.paymentMethod(); sale.saleNo = number("POS"); sale = posSales.save(sale);
        for (int i = 0; i < selected.size(); i++) { EventProduct product = selected.get(i); PosSaleItem line = new PosSaleItem(); line.posSaleId = sale.id; line.eventProductId = product.id; line.quantity = input.items().get(i).quantity(); line.unitPrice = product.price; posItems.save(line); }
        return posView(sale);
    }
    @Transactional
    public PosView cancelPos(UserAccount owner, Long id) { PosSale sale = posSales.findById(id).orElseThrow(() -> ApiException.notFound("판매 기록을 찾을 수 없습니다.")); if (!ownedEventBoothIds(owner).contains(sale.eventBoothId)) throw ApiException.forbidden("다른 부스의 판매 기록입니다."); sale.status = PosStatus.CANCELED; return posView(posSales.save(sale)); }

    public List<EventView> adminEvents() { return events.findAllByOrderByStartAtDesc().stream().map(this::eventView).toList(); }
    public EventView adminEvent(Long id) { return eventView(requireEvent(id)); }
    @Transactional public EventView createEvent(EventInput input) { Event value = new Event(); apply(value, input); return eventView(events.save(value)); }
    @Transactional public EventView updateEvent(Long id, EventInput input) { Event value = requireEvent(id); apply(value, input); return eventView(events.save(value)); }
    @Transactional public EventView publishEvent(Long id) { Event value = requireEvent(id); value.status = EventStatus.PUBLISHED; return eventView(events.save(value)); }
    @Transactional public EventView endEvent(Long id) { Event value = requireEvent(id); value.status = EventStatus.ENDED; return eventView(events.save(value)); }
    @Transactional public void deleteEvent(Long id) { Event value = requireEvent(id); if (!publicEventBoothsForAdmin(id).isEmpty()) throw ApiException.conflict("참가 부스가 연결된 행사는 삭제할 수 없습니다."); events.delete(value); }
    public List<ApplicationView> applications() { return eventBooths.findAllByOrderByIdDesc().stream().map(this::applicationView).toList(); }
    @Transactional public ApplicationView approve(Long id) { EventBooth value = requireEventBooth(id); value.status = ApplicationStatus.APPROVED; value.isPublic = true; if (value.boothNumber == null) value.boothNumber = "미정"; return applicationView(eventBooths.save(value)); }
    @Transactional public ApplicationView reject(Long id, RejectInput input) { EventBooth value = requireEventBooth(id); value.status = ApplicationStatus.REJECTED; value.isPublic = false; value.rejectionReason = input.reason(); return applicationView(eventBooths.save(value)); }

    private List<EventBooth> publicEventBoothsForAdmin(Long eventId) { return eventBooths.findAllByOrderByIdDesc().stream().filter(value -> Objects.equals(value.eventId, eventId)).toList(); }
    private Event requireEvent(Long id) { return events.findById(id).orElseThrow(() -> ApiException.notFound("행사를 찾을 수 없습니다.")); }
    private Booth requireOwnedBooth(UserAccount owner, Long id) { Booth value = booths.findById(id).orElseThrow(() -> ApiException.notFound("부스를 찾을 수 없습니다.")); if (!Objects.equals(value.ownerUserId, owner.id)) throw ApiException.forbidden("다른 크리에이터의 부스입니다."); return value; }
    private EventBooth requireEventBooth(Long id) { return eventBooths.findById(id).orElseThrow(() -> ApiException.notFound("행사 부스를 찾을 수 없습니다.")); }
    private EventBooth requirePublicEventBooth(Long id) { EventBooth value = requireEventBooth(id); Event event = requireEvent(value.eventId); if (value.status != ApplicationStatus.APPROVED || !value.isPublic || event.status == EventStatus.DRAFT) throw ApiException.notFound("공개된 부스를 찾을 수 없습니다."); return value; }
    private EventBooth requireOwnedEventBooth(UserAccount owner, Long id) { EventBooth value = requireEventBooth(id); requireOwnedBooth(owner, value.boothId); return value; }
    private EventBooth requireMutableOwnedEventBooth(UserAccount owner, Long id) { EventBooth value = requireOwnedEventBooth(owner, id); if (requireEvent(value.eventId).status == EventStatus.ENDED) throw ApiException.conflict("종료된 행사는 수정하거나 새 판매를 기록할 수 없습니다."); return value; }
    private EventProduct requireOwnedEventProduct(UserAccount owner, Long id) { EventProduct value = eventProducts.findById(id).orElseThrow(() -> ApiException.notFound("상품을 찾을 수 없습니다.")); requireOwnedEventBooth(owner, value.eventBoothId); return value; }
    private BoothNotice requireNotice(Long id) { return notices.findById(id).orElseThrow(() -> ApiException.notFound("공지를 찾을 수 없습니다.")); }
    private Reservation requireReservation(Long id) { return reservations.findById(id).orElseThrow(() -> ApiException.notFound("예약을 찾을 수 없습니다.")); }
    private List<Long> ownedEventBoothIds(UserAccount owner) { List<Long> boothIds = booths.findByOwnerUserIdOrderByIdDesc(owner.id).stream().map(value -> value.id).toList(); return boothIds.isEmpty() ? List.of() : eventBooths.findByBoothIdIn(boothIds).stream().map(value -> value.id).toList(); }
    private void decrement(EventProduct item, int quantity) { if (item.stockMode == StockMode.FINITE) { int current = item.stockQuantity == null ? 0 : item.stockQuantity; if (current < quantity) throw ApiException.conflict(itemName(item) + "의 재고가 부족합니다."); item.stockQuantity = current - quantity; eventProducts.save(item); } }
    private void increment(EventProduct item, int quantity) { if (item.stockMode == StockMode.FINITE) { item.stockQuantity = (item.stockQuantity == null ? 0 : item.stockQuantity) + quantity; eventProducts.save(item); } }
    private String itemName(EventProduct item) { return products.findById(item.productId).map(value -> value.name).orElse("상품"); }
    private void unpinAll(Long eventBoothId, Long except) { for (BoothNotice notice : notices.findByEventBoothIdOrderByPinnedDescCreatedAtDesc(eventBoothId)) if (notice.pinned && !Objects.equals(notice.id, except)) { notice.pinned = false; notices.save(notice); } }
    private void apply(Booth value, BoothInput input) { value.name = input.name(); value.description = text(input.intro()); value.imageKey = input.imageKey(); value.snsUrl = input.snsUrl(); }
    private void apply(EventProduct value, ProductInput input) { if (input.stockMode() == StockMode.FINITE && input.stockQuantity() == null) throw ApiException.badRequest("유한 재고 상품은 재고 수량이 필요합니다."); value.price = input.price(); value.stockMode = input.stockMode(); value.stockQuantity = input.stockMode() == StockMode.INFINITE ? null : input.stockQuantity(); value.soldOut = input.soldOut(); value.isPublic = input.isPublic(); value.reservationEnabled = input.reservationEnabled(); }
    private void apply(BoothNotice value, NoticeInput input) { value.title = input.title(); value.body = input.body(); value.pinned = input.pinned(); }
    private void apply(Event value, EventInput input) { if (!input.startAt().isBefore(input.endAt())) throw ApiException.badRequest("행사 시작은 종료보다 빨라야 합니다."); value.name = input.name(); value.startAt = input.startAt(); value.endAt = input.endAt(); value.venue = input.venue(); value.description = text(input.description()); value.imageKey = input.imageKey(); value.reservationStartAt = input.reservationStartAt(); value.reservationEndAt = input.reservationEndAt(); value.status = input.status() == null ? EventStatus.DRAFT : input.status(); }
    private EventView eventView(Event value) { long count = eventBooths.findAllByOrderByIdDesc().stream().filter(item -> Objects.equals(item.eventId, value.id) && item.status == ApplicationStatus.APPROVED).count(); return new EventView(value.id, value.name, value.startAt, value.endAt, value.venue, value.description, image(value.imageKey), value.status, count); }
    private BoothView basicBoothView(Booth value) { return new BoothView(value.id, null, value.name, users.findById(value.ownerUserId).map(user -> user.displayName).orElse("크리에이터"), "", value.description, image(value.imageKey), value.imageKey, value.snsUrl, ApplicationStatus.APPROVED, false, products.findByBoothIdOrderByIdDesc(value.id).size(), 0, List.of()); }
    private BoothView boothView(EventBooth value) { Booth booth = booths.findById(value.boothId).orElseThrow(); List<EventProduct> lines = eventProducts.findByEventBoothIdOrderByIdDesc(value.id); long reservable = lines.stream().filter(item -> item.isPublic && item.reservationEnabled && !item.soldOut).count(); return new BoothView(value.id, value.eventId, booth.name, users.findById(booth.ownerUserId).map(user -> user.displayName).orElse("크리에이터"), text(value.boothNumber), value.intro, image(booth.imageKey), booth.imageKey, booth.snsUrl, value.status, value.isPublic, lines.size(), reservable, notices.findByEventBoothIdOrderByPinnedDescCreatedAtDesc(value.id).stream().map(this::noticeView).toList()); }
    private ProductView productView(EventProduct value) { Product product = products.findById(value.productId).orElseThrow(); return new ProductView(value.id, value.eventBoothId, product.name, product.description, image(product.imageKey), product.imageKey, value.price, value.stockMode, value.stockQuantity, value.soldOut, value.isPublic, value.reservationEnabled); }
    private NoticeView noticeView(BoothNotice value) { return new NoticeView(value.id, value.eventBoothId, value.title, value.body, value.pinned, value.createdAt); }
    private ApplicationView applicationView(EventBooth value) { Event event = requireEvent(value.eventId); Booth booth = booths.findById(value.boothId).orElseThrow(); UserAccount owner = users.findById(booth.ownerUserId).orElseThrow(); return new ApplicationView(value.id, event.id, event.name, booth.id, booth.name, owner.displayName, value.status, value.rejectionReason); }
    private ReservationView reservationView(Reservation value) { EventBooth eb = requireEventBooth(value.eventBoothId); Event event = requireEvent(eb.eventId); Booth booth = booths.findById(eb.boothId).orElseThrow(); List<ReservationItemView> items = reservationItems.findByReservationId(value.id).stream().map(line -> new ReservationItemView(line.id, line.eventProductId, itemName(eventProducts.findById(line.eventProductId).orElseThrow()), line.quantity, line.unitPrice)).toList(); return new ReservationView(value.id, value.reservationNo, value.eventBoothId, event.name, booth.name, value.status, value.qrToken, value.createdAt, items); }
    private PosView posView(PosSale value) { List<ReservationItemView> items = posItems.findByPosSaleId(value.id).stream().map(line -> new ReservationItemView(line.id, line.eventProductId, itemName(eventProducts.findById(line.eventProductId).orElseThrow()), line.quantity, line.unitPrice)).toList(); long total = items.stream().mapToLong(line -> line.unitPrice() * line.quantity()).sum(); return new PosView(value.id, value.saleNo, value.eventBoothId, value.paymentMethod, value.status, value.soldAt, total, items); }
    private String image(String key) { if (key == null || key.isBlank()) return null; if (key.startsWith("http")) return key; return publicImageUrl.isBlank() ? null : publicImageUrl.replaceAll("/$", "") + "/" + key; }
    private String text(String value) { return value == null ? "" : value; }
    private String number(String prefix) { String stamp = DateTimeFormatter.ofPattern("yyMMdd-HHmmss").withZone(ZoneOffset.UTC).format(Instant.now()); return prefix + "-" + stamp + "-" + String.format("%03d", new Random().nextInt(1000)); }
}
