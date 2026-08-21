package com.boothhana.upload;

import com.boothhana.api.ApiModels.UploadInput;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class R2UploadServiceTests {
    @Test
    void createsBrowserCompatiblePresignedPutUrl() {
        // Keep the browser upload contract explicit: the client sends only Content-Type,
        // so the presigned request must not require additional checksum headers.
        // Deployment QA: docs/qa/2026-08-21-deployment-qa-report.md
        var service = new R2UploadService("account-id", "access-key", "secret-key", "images");

        var upload = service.presign(42L, new UploadInput("sample.png", "image/png", "product"));

        assertThat(upload.objectKey()).startsWith("product/42/").endsWith(".png");
        assertThat(upload.uploadUrl())
            .contains("X-Amz-Algorithm=AWS4-HMAC-SHA256")
            .contains("X-Amz-SignedHeaders=content-type%3Bhost")
            .doesNotContainIgnoringCase("x-amz-checksum")
            .doesNotContainIgnoringCase("x-amz-sdk-checksum");
    }
}
