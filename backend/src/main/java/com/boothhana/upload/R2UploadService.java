package com.boothhana.upload;

import com.boothhana.api.ApiException;
import com.boothhana.api.ApiModels.UploadInput;
import com.boothhana.api.ApiModels.UploadView;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import java.net.URI;
import java.time.Duration;
import java.util.*;

@Service
public class R2UploadService {
    private static final Set<String> TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private final String accountId, accessKey, secretKey, bucket;
    public R2UploadService(@Value("${app.r2.account-id:}") String accountId, @Value("${app.r2.access-key:}") String accessKey,
            @Value("${app.r2.secret-key:}") String secretKey, @Value("${app.r2.bucket:}") String bucket) {
        this.accountId = accountId; this.accessKey = accessKey; this.secretKey = secretKey; this.bucket = bucket;
    }
    public UploadView presign(Long ownerId, UploadInput input) {
        if (!TYPES.contains(input.contentType())) throw ApiException.badRequest("JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다.");
        if (accountId.isBlank() || accessKey.isBlank() || secretKey.isBlank() || bucket.isBlank()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "R2_NOT_CONFIGURED", "R2 환경변수가 아직 설정되지 않았습니다.");
        String extension = input.fileName().contains(".") ? input.fileName().substring(input.fileName().lastIndexOf('.')).replaceAll("[^A-Za-z0-9.]", "") : "";
        String key = input.target() + "/" + ownerId + "/" + UUID.randomUUID() + extension.toLowerCase(Locale.ROOT);
        try (S3Presigner presigner = S3Presigner.builder().endpointOverride(URI.create("https://" + accountId + ".r2.cloudflarestorage.com"))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey))).region(Region.of("auto"))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build()).build()) {
            PutObjectRequest put = PutObjectRequest.builder().bucket(bucket).key(key).contentType(input.contentType()).build();
            String url = presigner.presignPutObject(PutObjectPresignRequest.builder().signatureDuration(Duration.ofMinutes(10)).putObjectRequest(put).build()).url().toString();
            return new UploadView(url, key);
        }
    }
}
