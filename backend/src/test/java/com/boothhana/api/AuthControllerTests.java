package com.boothhana.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.web.csrf.DefaultCsrfToken;

class AuthControllerTests {
    private final AuthController controller = new AuthController();

    @Test
    void loginStoresSelectedRoleAndRedirectsToKakao() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        var result = controller.login("CREATOR", response);

        assertThat(result.getStatusCode().value()).isEqualTo(302);
        assertThat(result.getHeaders().getLocation().toString()).isEqualTo("/oauth2/authorization/kakao");
        assertThat(response.getHeader("Set-Cookie")).contains("BOOTH_ROLE=CREATOR", "HttpOnly", "SameSite=Lax");
    }

    @Test
    void csrfReturnsTokenForCrossOriginFrontend() {
        var token = new DefaultCsrfToken("X-XSRF-TOKEN", "_csrf", "test-token");

        Map<String, String> result = controller.csrf(token);

        assertThat(result).containsEntry("token", "test-token");
    }
}
