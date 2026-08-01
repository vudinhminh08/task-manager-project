package vn.edu.hust.expensetracker.transaction;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<TransactionResponse> list(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String month) {
        return transactionService.list(userId, type, category, month);
    }

    @GetMapping("/{id}")
    public TransactionResponse get(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return transactionService.get(userId, id);
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody TransactionRequest request) {
        TransactionResponse response = transactionService.create(userId, request);
        return ResponseEntity
                .created(URI.create("/api/transactions/" + response.id()))
                .body(response);
    }

    @PutMapping("/{id}")
    public TransactionResponse update(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request) {
        return transactionService.update(userId, id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        transactionService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
