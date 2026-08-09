package com.boothhana.security;

import com.boothhana.domain.UserAccount;
import com.boothhana.domain.DomainEnums.Role;
import com.boothhana.repository.UserAccountRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.util.*;

@Service
public class KakaoOAuthUserService extends DefaultOAuth2UserService {
    private final UserAccountRepository users;
    private final String adminSubject;

    public KakaoOAuthUserService(UserAccountRepository users, @Value("${app.admin-kakao-subject:}") String adminSubject) {
        this.users = users; this.adminSubject = adminSubject;
    }

    @Override @Transactional
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User kakao = super.loadUser(request);
        String subject = kakaoSubject(kakao.getAttribute("id"));
        UserAccount user = users.findByKakaoSubject(subject).orElseGet(UserAccount::new);
        user.kakaoSubject = subject;
        user.displayName = nickname(kakao.getAttributes());
        if (!adminSubject.isBlank() && adminSubject.equals(subject)) user.role = Role.ADMIN;
        else if (user.role == null) user.role = requestedRole();
        users.save(user);
        return new DefaultOAuth2User(List.of(new SimpleGrantedAuthority("ROLE_" + user.role.name())), kakao.getAttributes(), "id");
    }

    static String kakaoSubject(Object id) {
        return Objects.toString(id, "");
    }

    @SuppressWarnings("unchecked")
    private String nickname(Map<String, Object> attributes) {
        Object properties = attributes.get("properties");
        if (properties instanceof Map<?, ?> values) return String.valueOf(((Map<String, Object>) values).getOrDefault("nickname", "BoothHana 사용자"));
        return "BoothHana 사용자";
    }

    private Role requestedRole() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            HttpServletRequest request = attrs.getRequest();
            if (request.getCookies() != null) for (Cookie cookie : request.getCookies()) if ("BOOTH_ROLE".equals(cookie.getName()) && "CREATOR".equals(cookie.getValue())) return Role.CREATOR;
        }
        return Role.FAN;
    }
}
