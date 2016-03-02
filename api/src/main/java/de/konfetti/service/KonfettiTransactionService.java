package de.konfetti.service;

import java.util.List;

import de.konfetti.data.KonfettiTransaction;

public interface KonfettiTransactionService {

    KonfettiTransaction store(Integer type, String fromAccount, String toAmount, Long konfettiAmount, String additionalDataJSON);
    
    List<KonfettiTransaction> getAllTransactionsToAccount(String toAccount);
    
    List<KonfettiTransaction> getAllTransactionsFromAccount(String fromAccount);

	List<KonfettiTransaction> getAllTransactionsFromAccountSinceTS(String accountNameFromRequest, Long time);

	List<KonfettiTransaction> getAllTransactionsToAccountSinceTS(String accountNameFromRequest, Long time);
}