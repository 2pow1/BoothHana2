package com.boothhana.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.*;
import java.util.*;

@Configuration
public class SecurityConfig {
    @Bean
    SecurityFilterChain security(HttpSecurity http, KakaoOAuthUserService oauthUsers,
            @Qualifier("cors") CorsConfigurationSource corsSource,
            @Value("${app.frontend-url}") String frontendUrl) throws Exception {
        CookieCsrfTokenRepository csrf = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrf.setCookiePath("/");
        http.cors(cors -> cors.configurationSource(corsSource)).csrf(config -> config.csrfTokenRepository(csrf))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/public/**", "/api/auth/**", "/error").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/creator/**").hasRole("CREATOR")
                .requestMatchers("/api/me/**", "/api/me").authenticated()
                .anyRequest().permitAll())
            .oauth2Login(oauth -> oauth.userInfoEndpoint(info -> info.userService(oauthUsers))
                .successHandler((request, response, authentication) -> response.sendRedirect(frontendUrl + "/")))
            .logout(logout -> logout.logoutUrl("/api/logout").logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)));
        return http.build();
    }

    @Bean
    CorsConfigurationSource cors(@Value("${app.allowed-origins}") String origins) {
        CorsConfiguration value = new CorsConfiguration();
        value.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).filter(item -> !item.isBlank()).toList());
        value.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        value.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN"));
        value.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource(); source.registerCorsConfiguration("/**", value); return source;
    }
}
