package vn.edu.hust.taskmanager.auth.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException();
        }

        User user;
        try {
            user = userRepository.saveAndFlush(
                    new User(email, passwordEncoder.encode(request.password()), request.fullName(), request.phone()));
        } catch (DataIntegrityViolationException exception) {
            throw new EmailAlreadyExistsException();
        }
        return responseFor(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return responseFor(user);
    }

    @Transactional(readOnly = true)
    public UserResponse profile(Long userId) {
        return toUserResponse(findUser(userId));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = findUser(userId);
        user.updateFullName(request.fullName());
        return toUserResponse(userRepository.save(user));
    }

    private AuthResponse responseFor(User user) {
        return new AuthResponse(
                jwtService.createToken(user.getId()),
                "Bearer",
                jwtService.expirationSeconds(),
                toUserResponse(user));
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getPhone());
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(InvalidCredentialsException::new);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
