package com.boothhana.repository;
import com.boothhana.domain.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface ReservationRepository extends JpaRepository<Reservation, Long> { List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId); List<Reservation> findByEventBoothIdInOrderByCreatedAtDesc(List<Long> eventBoothIds); Optional<Reservation> findByReservationNo(String reservationNo); long countByEventBoothId(Long eventBoothId); }
