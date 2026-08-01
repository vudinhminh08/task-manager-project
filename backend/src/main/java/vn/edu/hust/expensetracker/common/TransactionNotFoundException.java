package vn.edu.hust.expensetracker.common;

public class TransactionNotFoundException extends RuntimeException {

    public TransactionNotFoundException() {
        super("Không tìm thấy giao dịch");
    }
}
