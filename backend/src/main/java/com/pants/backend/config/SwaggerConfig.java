package com.pants.backend.config;

import java.lang.annotation.Annotation;
import java.util.Set;

import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.HeaderParameter;

@Configuration
@SecurityScheme(
        name = "basicAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "basic"
)
@OpenAPIDefinition(
        security = @SecurityRequirement(name = "basicAuth")
)
public class SwaggerConfig {

    // Lisää Swagger UI:hin X-CSRF-TOKEN-kentän muokkaaviin pyyntöihin.
    // Token haetaan ensin GET /api/auth/csrf -endpointista.
    @Bean
    public OperationCustomizer csrfHeaderCustomizer() {
        Set<Class<? extends Annotation>> mutatingMappings = Set.of(
                PostMapping.class, PutMapping.class, PatchMapping.class, DeleteMapping.class);

        return (operation, handlerMethod) -> {
            boolean isMutating = mutatingMappings.stream()
                    .anyMatch(handlerMethod::hasMethodAnnotation);

            if (isMutating) {
                operation.addParametersItem(new HeaderParameter()
                        .name("X-CSRF-TOKEN")
                        .description("CSRF token from GET /api/auth/csrf")
                        .required(false)
                        .schema(new StringSchema()));
            }
            return operation;
        };
    }
}
