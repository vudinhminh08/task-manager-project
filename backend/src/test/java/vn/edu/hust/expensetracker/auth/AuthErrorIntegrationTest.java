package vn.edu.hust.expensetracker.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import vn.edu.hust.expensetracker.common.EmailAlreadyExistsException;
import vn.edu.hust.expensetracker.common.InvalidCredentialsException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AuthErrorIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Test
    void invalidRegisterReturnsValidationApiErrorFromEmbeddedServer() throws Exception {
        HttpResponse<String> response = post("/api/auth/register", """
                {"email":"invalid","password":"short"}
                """);

        assertError(response, 400, "VALIDATION_ERROR", "/api/auth/register");
        JsonNode fieldErrors = objectMapper.readTree(response.body()).get("fieldErrors");
        assertThat(fieldErrors.has("email")).isTrue();
        assertThat(fieldErrors.has("password")).isTrue();
    }

    @Test
    void malformedLoginReturnsMalformedRequestApiErrorFromEmbeddedServer() throws Exception {
        HttpResponse<String> response = post("/api/auth/login", "{");

        assertError(response, 400, "MALFORMED_REQUEST", "/api/auth/login");
        assertThat(objectMapper.readTree(response.body()).get("fieldErrors").isEmpty()).isTrue();
    }

    @Test
    void duplicateRegisterReturnsConflictApiErrorFromEmbeddedServer() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new EmailAlreadyExistsException());

        HttpResponse<String> response = post("/api/auth/register", """
                {"email":"demo@example.com","password":"Demo@2026"}
                """);

        assertError(response, 409, "EMAIL_ALREADY_EXISTS", "/api/auth/register");
        assertThat(objectMapper.readTree(response.body()).get("message").stringValue())
                .isEqualTo("Email đã tồn tại");
    }

    @Test
    void invalidLoginReturnsUnauthorizedApiErrorFromEmbeddedServer() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException());

        HttpResponse<String> response = post("/api/auth/login", """
                {"email":"demo@example.com","password":"Wrong@2026"}
                """);

        assertError(response, 401, "INVALID_CREDENTIALS", "/api/auth/login");
        assertThat(objectMapper.readTree(response.body()).get("message").stringValue())
                .isEqualTo("Email hoặc mật khẩu không đúng");
    }

    private HttpResponse<String> post(String path, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(
                        "http://localhost:" + port + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private void assertError(
            HttpResponse<String> response,
            int status,
            String code,
            String path) throws Exception {
        assertThat(response.statusCode()).isEqualTo(status);
        assertThat(response.headers().firstValue("Content-Type"))
                .hasValueSatisfying(value -> assertThat(value)
                        .startsWith("application/json"));
        JsonNode error = objectMapper.readTree(response.body());
        assertThat(error.get("timestamp").stringValue()).isNotBlank();
        assertThat(error.get("status").asInt()).isEqualTo(status);
        assertThat(error.get("code").stringValue()).isEqualTo(code);
        assertThat(error.get("path").stringValue()).isEqualTo(path);
    }
}
