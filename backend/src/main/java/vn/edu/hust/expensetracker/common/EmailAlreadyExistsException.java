package vn.edu.hust.expensetracker.common;

public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException() {
        super("Email đã tồn tại");
    }
}
