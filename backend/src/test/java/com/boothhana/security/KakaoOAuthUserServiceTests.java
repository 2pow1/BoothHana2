package com.boothhana.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class KakaoOAuthUserServiceTests {
    @Test
    void convertsLongKakaoIdToString() {
        assertThat(KakaoOAuthUserService.kakaoSubject(123456789L)).isEqualTo("123456789");
    }

    @Test
    void convertsMissingKakaoIdToEmptyString() {
        assertThat(KakaoOAuthUserService.kakaoSubject(null)).isEmpty();
    }
}
