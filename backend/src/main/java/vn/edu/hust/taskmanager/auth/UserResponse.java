package vn.edu.hust.taskmanager.auth;

public record UserResponse(Long id, String email, String fullName, String phone) {

    public UserResponse(Long id, String email) {
        this(id, email, "", null);
    }
}
