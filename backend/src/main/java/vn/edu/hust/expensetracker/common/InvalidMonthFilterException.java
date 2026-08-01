package vn.edu.hust.expensetracker.common;

public class InvalidMonthFilterException extends IllegalArgumentException {

    public InvalidMonthFilterException(Throwable cause) {
        super("Tháng phải có định dạng YYYY-MM", cause);
    }
}
