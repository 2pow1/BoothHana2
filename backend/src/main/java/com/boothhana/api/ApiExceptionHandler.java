package com.boothhana.api;

import com.boothhana.api.ApiModels.ErrorView;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorView> handle(ApiException exception) {
        return ResponseEntity.status(exception.status).body(new ErrorView(exception.status.value(), exception.code, exception.getMessage(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorView> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ErrorView(400, "VALIDATION_FAILED", "입력값을 확인해 주세요.", fields));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorView> handleUnexpected(Exception exception) {
        return ResponseEntity.internalServerError().body(new ErrorView(500, "INTERNAL_ERROR", "요청을 처리하지 못했습니다.", null));
    }
}
