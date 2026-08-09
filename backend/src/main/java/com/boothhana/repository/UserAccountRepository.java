package com.boothhana.repository;
import com.boothhana.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> { Optional<UserAccount> findByKakaoSubject(String kakaoSubject); }
