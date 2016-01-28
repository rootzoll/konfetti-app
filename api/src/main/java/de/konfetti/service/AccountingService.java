package de.konfetti.service;

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
	
	boolean createAccount(String accountName) throws Exception;
	
	boolean deleteAccount(String accountName) throws Exception;
	
	boolean transfereBetweenAccounts(String fromAccountName, String toAccountName, long amount) throws Exception;
	
	// returns the resulting account balance
	Long addBalanceToAccount(String accountName, long amount) throws Exception;
	
	// returns the resulting account balance
	Long removeBalanceFromAccount(String accountName, long amount) throws Exception;
	
}