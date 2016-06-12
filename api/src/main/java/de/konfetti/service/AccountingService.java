package de.konfetti.service;

import de.konfetti.data.Account;

/*
 * abstract layer to a simple accounting service ... mapping account names (strings) to a balance and allowing transactions between accounts
 */
public interface AccountingService {

	/*
	 * important detail:
	 * return NULL if no account
	 * return 0 account with zero balance 
	 */
	Long getBalanceOfAccount(String accountName);

	Long getBalanceEarnedOfAccount(String accountName);

	boolean createAccount(String accountName) throws Exception;

	boolean deleteAccount(String accountName) throws Exception;

	Account findAccountByName(String name);

	boolean transfereBetweenAccounts(Integer transactionType, String fromAccountName, String toAccountName, long amount) throws Exception;

	// returns the resulting account balance
	Long addBalanceToAccount(Integer transactionType, String accountName, long amount) throws Exception;

	// returns the resulting account balance
	Long removeBalanceFromAccount(Integer transactionType, String accountName, long amount) throws Exception;

	Long getAllKonfettiBalance();

}