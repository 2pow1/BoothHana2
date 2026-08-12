package com.boothhana.api;

import com.boothhana.domain.DomainEnums.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class ApiModels {
    private ApiModels() {}

    public record UserView(Long id, String displayName, List<Permission> permissions) {}
    public record EventView(Long id, String name, Instant startAt, Instant endAt, String venue, String description, String imageUrl, Instant reservationStartAt, Instant reservationEndAt, EventStatus status, long boothCount, ApplicationStatus applicationStatus) {}
    public record EventInput(@NotBlank String name, @NotNull Instant startAt, @NotNull Instant endAt, @NotBlank String venue, String description, String imageKey, Instant reservationStartAt, Instant reservationEndAt, EventStatus status) {}
    public record BoothView(Long id, Long eventId, String name, String creatorName, String boothNumber, String intro, String imageUrl, String imageKey, String snsUrl, ApplicationStatus status, boolean isPublic, long productCount, long reservableCount, List<NoticeView> notices) {}
    public record BoothInput(@NotBlank String name, String intro, String imageKey, String snsUrl) {}
    public record ApplicationInput(@NotNull Long eventId, @NotNull Long boothId) {}
    public record ApplicationView(Long id, Long eventId, String eventName, Long boothId, String boothName, String creatorName, ApplicationStatus status, String reason) {}
    public record RejectInput(@NotBlank String reason) {}
    public record ProductInput(@NotBlank String name, String description, String imageKey, @PositiveOrZero long price, @NotNull StockMode stockMode, @PositiveOrZero Integer stockQuantity, boolean soldOut, boolean isPublic, boolean reservationEnabled) {}
    public record ProductView(Long id, Long eventBoothId, String name, String description, String imageUrl, String imageKey, long price, StockMode stockMode, Integer stockQuantity, boolean soldOut, boolean isPublic, boolean reservationEnabled) {}
    public record CopyProductsInput(List<Long> productIds) {}
    public record NoticeInput(@NotBlank String title, @NotBlank String body, boolean pinned) {}
    public record NoticeView(Long id, Long eventBoothId, String title, String body, boolean pinned, Instant createdAt) {}
    public record LineInput(@NotNull Long eventProductId, @Min(1) int quantity) {}
    public record ReservationInput(@NotNull Long eventBoothId, @NotEmpty List<@Valid LineInput> items) {}
    public record ReservationItemView(Long id, Long eventProductId, String productName, int quantity, long unitPrice) {}
    public record ReservationView(Long id, String reservationNo, Long eventBoothId, String eventName, String boothName, ReservationStatus status, String qrToken, Instant createdAt, List<ReservationItemView> items) {}
    public record PosInput(@NotNull Long eventBoothId, @NotNull PaymentMethod paymentMethod, @NotEmpty List<@Valid LineInput> items) {}
    public record PosView(Long id, String saleNo, Long eventBoothId, PaymentMethod paymentMethod, PosStatus status, Instant soldAt, long totalAmount, List<ReservationItemView> items) {}
    public record UploadInput(@NotBlank String fileName, @NotBlank String contentType, @Pattern(regexp = "booth|product") String target) {}
    public record UploadView(String uploadUrl, String objectKey) {}
    public record ErrorView(int status, String code, String message, Map<String, String> fieldErrors) {}
}
