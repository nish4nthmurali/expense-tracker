package com.expensetracker;

import com.expensetracker.dto.ExpenseRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ExpenseControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCreateExpenseSuccessfully() throws Exception {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("150.50"), "Food", "Lunch at restaurant", LocalDate.of(2026, 4, 20));

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.amount").value(150.50))
                .andExpect(jsonPath("$.category").value("Food"))
                .andExpect(jsonPath("$.description").value("Lunch at restaurant"))
                .andExpect(jsonPath("$.date").value("2026-04-20"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void shouldRejectNegativeAmount() throws Exception {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("-10.00"), "Food", "Invalid", LocalDate.of(2026, 4, 20));

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details[0].field").value("amount"));
    }

    @Test
    void shouldRejectMissingCategory() throws Exception {
        String json = """
                {"amount": 100.00, "description": "test", "date": "2026-04-20"}
                """;

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectZeroAmount() throws Exception {
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("0.00"), "Food", "Zero", LocalDate.of(2026, 4, 20));

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldHandleIdempotentRequests() throws Exception {
        String idempotencyKey = UUID.randomUUID().toString();
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("200.00"), "Transport", "Cab ride", LocalDate.of(2026, 4, 21));

        String requestJson = objectMapper.writeValueAsString(request);

        // First request — should create
        MvcResult first = mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Idempotency-Key", idempotencyKey)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andReturn();

        String firstId = objectMapper.readTree(first.getResponse().getContentAsString()).get("id").asText();

        // Second request with same key — should return same response, not create a duplicate
        MvcResult second = mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Idempotency-Key", idempotencyKey)
                        .content(requestJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(firstId))
                .andReturn();
    }

    @Test
    void shouldListExpenses() throws Exception {
        // Create a couple of expenses first
        createExpense("50.00", "Food", "Snack", "2026-04-18");
        createExpense("1200.00", "Rent", "April rent", "2026-04-01");
        createExpense("300.00", "Food", "Groceries", "2026-04-15");

        // List all
        mockMvc.perform(get("/api/expenses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(3))));
    }

    @Test
    void shouldFilterByCategory() throws Exception {
        createExpense("80.00", "Entertainment", "Movie tickets", "2026-04-10");
        createExpense("40.00", "Entertainment", "Game pass", "2026-04-12");
        createExpense("500.00", "Utilities", "Electricity bill", "2026-04-05");

        mockMvc.perform(get("/api/expenses").param("category", "Entertainment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].category", everyItem(equalToIgnoringCase("Entertainment"))));
    }

    @Test
    void shouldSortByDateDescending() throws Exception {
        createExpense("100.00", "Travel", "Train ticket", "2026-01-01");
        createExpense("200.00", "Travel", "Bus ticket", "2026-06-15");
        createExpense("150.00", "Travel", "Flight", "2026-03-20");

        mockMvc.perform(get("/api/expenses")
                        .param("category", "Travel")
                        .param("sort", "date_desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].date").value("2026-06-15"));
    }

    @Test
    void shouldReturnCategories() throws Exception {
        createExpense("10.00", "TestCat1", "test", "2026-04-01");
        createExpense("20.00", "TestCat2", "test", "2026-04-01");

        mockMvc.perform(get("/api/expenses/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasItem("TestCat1")))
                .andExpect(jsonPath("$", hasItem("TestCat2")));
    }

    private void createExpense(String amount, String category, String description, String date) throws Exception {
        String json = String.format(
                """
                {"amount": %s, "category": "%s", "description": "%s", "date": "%s"}
                """, amount, category, description, date);

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated());
    }
}
