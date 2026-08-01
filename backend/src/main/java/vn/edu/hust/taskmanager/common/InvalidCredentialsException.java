package vn.edu.hust.taskmanager.common;

public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Email hoặc mật khẩu không đúng");
    }
}
