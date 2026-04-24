package com.expensetracker.service;

import com.expensetracker.dto.ExpenseRequest;
import com.expensetracker.dto.ExpenseResponse;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.IdempotencyRecord;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.IdempotencyRecordRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final IdempotencyRecordRepository idempotencyRepository;
    private final ObjectMapper objectMapper;

    public ExpenseService(ExpenseRepository expenseRepository,
                          IdempotencyRecordRepository idempotencyRepository,
                          ObjectMapper objectMapper) {
        this.expenseRepository = expenseRepository;
        this.idempotencyRepository = idempotencyRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Creates a new expense with idempotency support.
     *
     * Strategy: reserve the idempotency key FIRST (insert with empty response),
     * then create the expense, then update the record with the response.
     * If two concurrent requests race, only one wins the key insert —
     * the loser catches DataIntegrityViolationException and returns the cached response.
     */
    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            // Check for existing completed idempotency record
            Optional<IdempotencyRecord> existing = idempotencyRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                return deserializeResponse(existing.get().getResponseBody());
            }

            // Reserve the key — if a concurrent request already reserved it,
            // we catch the unique constraint violation and return the cached response
            try {
                IdempotencyRecord placeholder = new IdempotencyRecord(idempotencyKey, "{}", 201);
                idempotencyRepository.saveAndFlush(placeholder);
            } catch (DataIntegrityViolationException e) {
                // Another concurrent request won the race — return its response
                Optional<IdempotencyRecord> raced = idempotencyRepository.findByIdempotencyKey(idempotencyKey);
                if (raced.isPresent() && !raced.get().getResponseBody().equals("{}")) {
                    return deserializeResponse(raced.get().getResponseBody());
                }
                throw new IllegalStateException("Concurrent request in progress for this idempotency key. Please retry.");
            }
        }

        // Create the expense
        Expense expense = new Expense(
                request.getAmount(),
                request.getCategory().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                request.getDate()
        );

        Expense saved = expenseRepository.save(expense);
        ExpenseResponse response = ExpenseResponse.fromEntity(saved);

        // Update idempotency record with the actual response
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            String responseJson = serializeResponse(response);
            Optional<IdempotencyRecord> record = idempotencyRepository.findByIdempotencyKey(idempotencyKey);
            record.ifPresent(r -> {
                r.setResponseBody(responseJson);
                idempotencyRepository.save(r);
            });
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpenses(String category, String sort) {
        List<Expense> expenses;
        boolean sortByDateDesc = "date_desc".equalsIgnoreCase(sort);

        if (category != null && !category.isBlank()) {
            expenses = sortByDateDesc
                    ? expenseRepository.findByCategoryIgnoreCaseOrderByDateDesc(category)
                    : expenseRepository.findByCategoryIgnoreCase(category);
        } else {
            expenses = sortByDateDesc
                    ? expenseRepository.findAllByOrderByDateDesc()
                    : expenseRepository.findAll();
        }

        return expenses.stream()
                .map(ExpenseResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return expenseRepository.findDistinctCategories();
    }

    private String serializeResponse(ExpenseResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize expense response", e);
        }
    }

    private ExpenseResponse deserializeResponse(String json) {
        try {
            return objectMapper.readValue(json, ExpenseResponse.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize cached response", e);
        }
    }
}
