package vn.edu.hust.taskmanager.auth;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public UserResponse profile(@AuthenticationPrincipal Long userId) {
        return authService.profile(userId);
    }

    @PatchMapping("/me")
    public UserResponse updateProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ProfileUpdateRequest request) {
        return authService.updateProfile(userId, request);
    }
}
