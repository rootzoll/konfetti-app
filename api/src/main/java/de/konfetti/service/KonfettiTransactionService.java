package de.konfetti.service;

import de.konfetti.data.KonfettiTransaction;
import de.konfetti.data.TransactionType;

import java.util.List;

public interface KonfettiTransactionService {

	KonfettiTransaction store(TransactionType type, String fromAccount, String toAmount, Long konfettiAmount, String additionalDataJSON);

	List<KonfettiTransaction> getAllTransactionsToAccount(String toAccount);
    
    List<KonfettiTransaction> getAllTransactionsFromAccount(String fromAccount);

	List<KonfettiTransaction> getAllTransactionsFromAccountSinceTS(String accountNameFromRequest, Long time);

	List<KonfettiTransaction> getAllTransactionsToAccountSinceTS(String accountNameFromRequest, Long time);
}