package com.boothhana.repository;
import com.boothhana.domain.PosSale;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PosSaleRepository extends JpaRepository<PosSale, Long> { List<PosSale> findByEventBoothIdInOrderBySoldAtDesc(List<Long> eventBoothIds); long countByEventBoothId(Long eventBoothId); }
