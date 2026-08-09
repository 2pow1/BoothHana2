package com.boothhana.security;

import com.boothhana.api.ApiException;
import com.boothhana.domain.UserAccount;
import com.boothhana.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    private final UserAccountRepository users;
    public CurrentUser(UserAccountRepository users) { this.users = users; }
    public UserAccount require(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "로그인이 필요합니다.");
        return users.findByKakaoSubject(authentication.getName()).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "계정 정보를 찾을 수 없습니다."));
    }
}
