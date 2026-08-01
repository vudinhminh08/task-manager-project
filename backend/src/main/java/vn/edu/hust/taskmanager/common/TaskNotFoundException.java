package vn.edu.hust.taskmanager.common;

public class TaskNotFoundException extends RuntimeException {
    public TaskNotFoundException() {
        super("Không tìm thấy công việc");
    }
}
