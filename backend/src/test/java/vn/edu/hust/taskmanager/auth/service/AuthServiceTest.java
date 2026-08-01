package vn.edu.hust.taskmanager.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import vn.edu.hust.taskmanager.common.EmailAlreadyExistsException;
import vn.edu.hust.taskmanager.common.InvalidCredentialsException;
import vn.edu.hust.taskmanager.security.JwtService;
import vn.edu.hust.taskmanager.auth.dto.AuthResponse;
import vn.edu.hust.taskmanager.auth.dto.LoginRequest;
import vn.edu.hust.taskmanager.auth.dto.ProfileUpdateRequest;
import vn.edu.hust.taskmanager.auth.dto.RegisterRequest;
import vn.edu.hust.taskmanager.auth.dto.UserResponse;
import vn.edu.hust.taskmanager.auth.model.User;
import vn.edu.hust.taskmanager.auth.repository.UserRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    private BCryptPasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void registerNormalizesEmailAndStoresBcryptHash() {
        when(userRepository.existsByEmail("demo@example.com")).thenReturn(false);
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 7L);
            return user;
        });
        when(jwtService.createToken(7L)).thenReturn("signed-token");
        when(jwtService.expirationSeconds()).thenReturn(7200L);

        AuthResponse response = authService.register(
                new RegisterRequest(" Demo@Example.com ", "Demo@2026"));

        verify(userRepository).existsByEmail("demo@example.com");
        verify(userRepository).saveAndFlush(argThat(user ->
                user.getEmail().equals("demo@example.com")
                        && !user.getPasswordHash().equals("Demo@2026")
                        && passwordEncoder.matches("Demo@2026", user.getPasswordHash())));
        assertThat(response).isEqualTo(new AuthResponse(
                "signed-token",
                "Bearer",
                7200L,
                new UserResponse(7L, "demo@example.com")));
    }

    @Test
    void registerRejectsDuplicateNormalizedEmail() {
        when(userRepository.existsByEmail("demo@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest(" Demo@Example.com ", "Demo@2026")))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessage("Email đã tồn tại");

        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void registerMapsConcurrentUniqueEmailViolationToDuplicateError() {
        when(userRepository.existsByEmail("demo@example.com")).thenReturn(false);
        when(userRepository.saveAndFlush(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("users_email_key"));

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("demo@example.com", "Demo@2026")))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessage("Email đã tồn tại");

        verify(jwtService, never()).createToken(any());
    }

    @Test
    void loginMatchesPasswordAndReturnsTokenAndUser() {
        User user = user(42L, "demo@example.com", passwordEncoder.encode("Demo@2026"));
        when(userRepository.findByEmail("demo@example.com")).thenReturn(Optional.of(user));
        when(jwtService.createToken(42L)).thenReturn("signed-token");
        when(jwtService.expirationSeconds()).thenReturn(3600L);

        AuthResponse response = authService.login(
                new LoginRequest(" DEMO@Example.com ", "Demo@2026"));

        assertThat(response).isEqualTo(new AuthResponse(
                "signed-token",
                "Bearer",
                3600L,
                new UserResponse(42L, "demo@example.com")));
    }

    @Test
    void loginRejectsMismatchedPassword() {
        User user = user(42L, "demo@example.com", passwordEncoder.encode("Demo@2026"));
        when(userRepository.findByEmail("demo@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(
                new LoginRequest("demo@example.com", "Wrong@2026")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Email hoặc mật khẩu không đúng");

        verify(jwtService, never()).createToken(any());
    }

    @Test
    void loginRejectsUnknownEmailWithSameCredentialsError() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(
                new LoginRequest("missing@example.com", "Demo@2026")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Email hoặc mật khẩu không đúng");
    }

    @Test
    void registerIncludesOptionalPhoneAndFullNameInUserResponse() {
        when(userRepository.existsByEmail("demo@example.com")).thenReturn(false);
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 8L);
            return user;
        });
        when(jwtService.createToken(8L)).thenReturn("signed-token");
        when(jwtService.expirationSeconds()).thenReturn(7200L);

        AuthResponse response = authService.register(
                new RegisterRequest("demo@example.com", "Demo@2026", " Demo User ", " +84901234567 "));

        assertThat(response.user()).isEqualTo(
                new UserResponse(8L, "demo@example.com", "Demo User", "+84901234567"));
    }

    @Test
    void profileCanReadAndUpdateOnlyFullName() {
        User user = new User("demo@example.com", "hash", "Old Name", "+84901234567");
        ReflectionTestUtils.setField(user, "id", 42L);
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        assertThat(authService.profile(42L)).isEqualTo(
                new UserResponse(42L, "demo@example.com", "Old Name", "+84901234567"));
        assertThat(authService.updateProfile(42L, new ProfileUpdateRequest(" New Name ")))
                .isEqualTo(new UserResponse(42L, "demo@example.com", "New Name", "+84901234567"));
        assertThat(user.getEmail()).isEqualTo("demo@example.com");
        assertThat(user.getPhone()).isEqualTo("+84901234567");
    }

    private User user(Long id, String email, String passwordHash) {
        User user = new User(email, passwordHash);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
