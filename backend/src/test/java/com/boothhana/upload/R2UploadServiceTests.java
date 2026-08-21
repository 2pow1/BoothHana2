package com.boothhana.upload;

import com.boothhana.api.ApiModels.UploadInput;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class R2UploadServiceTests {
    @Test
    void createsBrowserCompatiblePresignedPutUrl() {
        // Regression: deployment QA found that the custom S3 configuration enabled
        // checksum validation and produced a presigned request browsers could not execute.
        // Found by /qa on 2026-08-21.
        // Report: docs/qa/2026-08-21-deployment-qa-report.md
        var service = new R2UploadService("account-id", "access-key", "secret-key", "images");

        var upload = service.presign(42L, new UploadInput("sample.png", "image/png", "product"));

        assertThat(upload.objectKey()).startsWith("product/42/").endsWith(".png");
        assertThat(upload.uploadUrl())
            .contains("X-Amz-Algorithm=AWS4-HMAC-SHA256")
            .doesNotContainIgnoringCase("x-amz-checksum");
    }
}
