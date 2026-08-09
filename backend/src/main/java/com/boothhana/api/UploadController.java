package com.boothhana.api;

import com.boothhana.api.ApiModels.*;
import com.boothhana.security.CurrentUser;
import com.boothhana.upload.R2UploadService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/creator/uploads")
public class UploadController {
    private final CurrentUser current; private final R2UploadService uploads;
    public UploadController(CurrentUser current, R2UploadService uploads) { this.current = current; this.uploads = uploads; }
    @PostMapping("/presign") public UploadView presign(Authentication auth, @Valid @RequestBody UploadInput input) { return uploads.presign(current.require(auth).id, input); }
}
