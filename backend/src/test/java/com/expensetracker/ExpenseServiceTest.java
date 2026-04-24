package com.expensetracker;

import com.expensetracker.dto.ExpenseRequest;
import com.expensetracker.dto.ExpenseResponse;
import com.expensetracker.entity.IdempotencyRecord;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.IdempotencyRecordRepository;
import com.expensetracker.service.ExpenseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class ExpenseServiceTest {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private IdempotencyRecordRepository idempotencyRepository;

    @BeforeEach
    void setUp() {
        idempotencyRepository.deleteAll();
        expenseRepository.deleteAll();
    }

    @Test
    void createExpense_shouldPersistCorrectly() {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("99.99"), "Food", "Pizza night", LocalDate.of(2026, 4, 20));

        ExpenseResponse response = expenseService.createExpense(request, null);

        assertNotNull(response.getId());
        assertEquals(new BigDecimal("99.99"), response.getAmount());
        assertEquals("Food", response.getCategory());
        assertEquals("Pizza night", response.getDescription());
        assertEquals(LocalDate.of(2026, 4, 20), response.getDate());
        assertNotNull(response.getCreatedAt());
    }

    @Test
    void createExpense_withIdempotencyKey_shouldReturnSameResponse() {
        String key = UUID.randomUUID().toString();
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("500.00"), "Rent", "Monthly rent", LocalDate.of(2026, 4, 1));

        ExpenseResponse first = expenseService.createExpense(request, key);
        ExpenseResponse second = expenseService.createExpense(request, key);

        assertEquals(first.getId(), second.getId());
        assertEquals(first.getAmount(), second.getAmount());
        // Only one expense should be in the DB
        assertEquals(1, expenseRepository.count());
    }

    @Test
    void createExpense_differentIdempotencyKeys_shouldCreateSeparateExpenses() {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("100.00"), "Food", "Dinner", LocalDate.of(2026, 4, 15));

        expenseService.createExpense(request, UUID.randomUUID().toString());
        expenseService.createExpense(request, UUID.randomUUID().toString());

        assertEquals(2, expenseRepository.count());
    }

    @Test
    void createExpense_withoutIdempotencyKey_shouldAlwaysCreate() {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("50.00"), "Transport", "Bus fare", LocalDate.of(2026, 4, 10));

        expenseService.createExpense(request, null);
        expenseService.createExpense(request, null);

        assertEquals(2, expenseRepository.count());
    }

    @Test
    void getExpenses_shouldReturnAll() {
        createTestExpense("100.00", "Food", "2026-04-20");
        createTestExpense("200.00", "Transport", "2026-04-19");

        List<ExpenseResponse> expenses = expenseService.getExpenses(null, null);

        assertEquals(2, expenses.size());
    }

    @Test
    void getExpenses_filterByCategory_shouldReturnMatching() {
        createTestExpense("100.00", "Food", "2026-04-20");
        createTestExpense("200.00", "Transport", "2026-04-19");
        createTestExpense("150.00", "Food", "2026-04-18");

        List<ExpenseResponse> expenses = expenseService.getExpenses("Food", null);

        assertEquals(2, expenses.size());
        assertTrue(expenses.stream().allMatch(e -> e.getCategory().equalsIgnoreCase("Food")));
    }

    @Test
    void getExpenses_sortByDateDesc_shouldReturnNewestFirst() {
        createTestExpense("100.00", "Food", "2026-01-01");
        createTestExpense("200.00", "Food", "2026-06-15");
        createTestExpense("150.00", "Food", "2026-03-20");

        List<ExpenseResponse> expenses = expenseService.getExpenses(null, "date_desc");

        assertEquals(LocalDate.of(2026, 6, 15), expenses.get(0).getDate());
        assertEquals(LocalDate.of(2026, 3, 20), expenses.get(1).getDate());
        assertEquals(LocalDate.of(2026, 1, 1), expenses.get(2).getDate());
    }

    @Test
    void getExpenses_filterAndSort_shouldWork() {
        createTestExpense("100.00", "Food", "2026-01-01");
        createTestExpense("200.00", "Transport", "2026-06-15");
        createTestExpense("150.00", "Food", "2026-03-20");

        List<ExpenseResponse> expenses = expenseService.getExpenses("Food", "date_desc");

        assertEquals(2, expenses.size());
        assertEquals(LocalDate.of(2026, 3, 20), expenses.get(0).getDate());
        assertEquals(LocalDate.of(2026, 1, 1), expenses.get(1).getDate());
    }

    @Test
    void createExpense_shouldTrimCategoryAndDescription() {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("50.00"), "  Food  ", "  Lunch  ", LocalDate.of(2026, 4, 20));

        ExpenseResponse response = expenseService.createExpense(request, null);

        assertEquals("Food", response.getCategory());
        assertEquals("Lunch", response.getDescription());
    }

    @Test
    void getCategories_shouldReturnDistinctCategories() {
        createTestExpense("100.00", "Food", "2026-04-20");
        createTestExpense("200.00", "Transport", "2026-04-19");
        createTestExpense("150.00", "Food", "2026-04-18");

        List<String> categories = expenseService.getCategories();

        assertEquals(2, categories.size());
        assertTrue(categories.contains("Food"));
        assertTrue(categories.contains("Transport"));
    }

    private void createTestExpense(String amount, String category, String date) {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal(amount), category, "Test expense", LocalDate.parse(date));
        expenseService.createExpense(request, null);
    }
}
