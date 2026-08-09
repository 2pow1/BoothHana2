package com.boothhana.repository;
import com.boothhana.domain.EventBooth;
import com.boothhana.domain.DomainEnums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface EventBoothRepository extends JpaRepository<EventBooth, Long> {
    List<EventBooth> findByEventIdAndStatusAndIsPublicTrue(Long eventId, ApplicationStatus status);
    List<EventBooth> findByStatusOrderByIdDesc(ApplicationStatus status);
    List<EventBooth> findAllByOrderByIdDesc();
    Optional<EventBooth> findByEventIdAndBoothId(Long eventId, Long boothId);
    List<EventBooth> findByBoothIdIn(List<Long> boothIds);
}
