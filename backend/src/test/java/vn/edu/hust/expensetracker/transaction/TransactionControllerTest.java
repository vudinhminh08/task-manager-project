package vn.edu.hust.expensetracker.transaction;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import vn.edu.hust.expensetracker.common.ApiExceptionHandler;
import vn.edu.hust.expensetracker.common.InvalidMonthFilterException;
import vn.edu.hust.expensetracker.common.TransactionNotFoundException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class TransactionControllerTest {

    private TransactionService transactionService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        transactionService = mock(TransactionService.class);
        mockMvc = standaloneSetup(new TransactionController(transactionService))
                .setControllerAdvice(new ApiExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken(42L, null));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listsTransactionsWithOptionalFiltersForAuthenticatedUser() throws Exception {
        when(transactionService.list(
                42L, TransactionType.EXPENSE, "Ăn uống", "2026-07"))
                .thenReturn(List.of(response()));

        mockMvc.perform(get("/api/transactions")
                        .param("type", "EXPENSE")
                        .param("category", "Ăn uống")
                        .param("month", "2026-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(9))
                .andExpect(jsonPath("$[0].type").value("EXPENSE"))
                .andExpect(jsonPath("$[0].category").value("Ăn uống"))
                .andExpect(jsonPath("$[0].userId").doesNotExist());

        verify(transactionService).list(
                42L, TransactionType.EXPENSE, "Ăn uống", "2026-07");
    }

    @Test
    void getsTransactionForAuthenticatedUser() throws Exception {
        when(transactionService.get(42L, 9L)).thenReturn(response());

        mockMvc.perform(get("/api/transactions/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(9));

        verify(transactionService).get(42L, 9L);
    }

    @Test
    void createsTransactionAndReturnsLocation() throws Exception {
        TransactionRequest request = request();
        when(transactionService.create(42L, request)).thenReturn(response());

        mockMvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson()))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/transactions/9"))
                .andExpect(jsonPath("$.id").value(9));

        verify(transactionService).create(42L, request);
    }

    @Test
    void updatesTransactionForAuthenticatedUser() throws Exception {
        TransactionRequest request = request();
        when(transactionService.update(42L, 9L, request)).thenReturn(response());

        mockMvc.perform(put("/api/transactions/9")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(9));

        verify(transactionService).update(42L, 9L, request);
    }

    @Test
    void deletesTransactionAndReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/transactions/9"))
                .andExpect(status().isNoContent());

        verify(transactionService).delete(42L, 9L);
    }

    @Test
    void returnsApiErrorWhenTransactionIsNotOwned() throws Exception {
        when(transactionService.get(42L, 9L))
                .thenThrow(new TransactionNotFoundException());

        mockMvc.perform(get("/api/transactions/9"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TRANSACTION_NOT_FOUND"))
                .andExpect(jsonPath("$.path").value("/api/transactions/9"));
    }

    @Test
    void returnsMalformedRequestForInvalidMonth() throws Exception {
        when(transactionService.list(42L, null, null, "bad-month"))
                .thenThrow(new InvalidMonthFilterException(
                        new DateTimeParseException("bad-month", "bad-month", 0)));

        mockMvc.perform(get("/api/transactions")
                        .param("month", "bad-month"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.fieldErrors.month")
                        .value("Tháng phải có định dạng YYYY-MM"));
    }

    @Test
    void returnsMalformedRequestForInvalidType() throws Exception {
        mockMvc.perform(get("/api/transactions")
                        .param("type", "OTHER"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.fieldErrors.type")
                        .value("Giá trị tham số không hợp lệ"));
    }

    @Test
    void returnsInternalErrorWithoutLeakingFailureDetails() throws Exception {
        // Stands in for any internal detail a driver or ORM may put in a
        // message, such as a datasource URL or a failing SQL statement.
        String internalDetail = "internal-datasource-detail-must-not-leak";
        when(transactionService.list(42L, null, null, null))
                .thenThrow(new IllegalStateException(internalDetail));

        mockMvc.perform(get("/api/transactions"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.path").value("/api/transactions"))
                .andExpect(jsonPath("$.fieldErrors").isEmpty())
                .andExpect(jsonPath("$.message")
                        .value("Đã xảy ra lỗi không mong muốn"))
                .andExpect(content().string(not(containsString(internalDetail))))
                .andExpect(content().string(not(containsString("IllegalStateException"))));
    }

    private TransactionRequest request() {
        return new TransactionRequest(
                TransactionType.EXPENSE,
                new BigDecimal("125000.00"),
                "Ăn uống",
                "Bữa trưa",
                LocalDate.of(2026, 7, 30));
    }

    private TransactionResponse response() {
        return new TransactionResponse(
                9L,
                TransactionType.EXPENSE,
                new BigDecimal("125000.00"),
                "Ăn uống",
                "Bữa trưa",
                LocalDate.of(2026, 7, 30),
                Instant.parse("2026-07-30T08:00:00Z"),
                Instant.parse("2026-07-30T08:00:00Z"));
    }

    private String requestJson() {
        return """
                {
                  "type": "EXPENSE",
                  "amount": 125000.00,
                  "category": "Ăn uống",
                  "description": "Bữa trưa",
                  "transactionDate": "2026-07-30"
                }
                """;
    }
}
