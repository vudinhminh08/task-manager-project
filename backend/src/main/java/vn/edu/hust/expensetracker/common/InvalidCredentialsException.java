package vn.edu.hust.expensetracker.common;

public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Email hoặc mật khẩu không đúng");
    }
}
