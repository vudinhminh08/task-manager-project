package vn.edu.hust.taskmanager.common;

public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException() {
        super("Email đã tồn tại");
    }
}
