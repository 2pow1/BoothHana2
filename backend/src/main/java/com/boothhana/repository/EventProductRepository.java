package com.boothhana.repository;
import com.boothhana.domain.EventProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface EventProductRepository extends JpaRepository<EventProduct, Long> { List<EventProduct> findByEventBoothIdOrderByIdDesc(Long eventBoothId); List<EventProduct> findByEventBoothIdAndIsPublicTrueOrderByIdDesc(Long eventBoothId); long countByProductId(Long productId); }
