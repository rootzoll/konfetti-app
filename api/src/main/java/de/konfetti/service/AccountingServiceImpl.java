package de.konfetti.service;

import java.util.List;
import java.util.Vector;

import de.konfetti.data.Account;
import de.konfetti.data.AccountRepository;
import de.konfetti.data.KonfettiTransaction;
import de.konfetti.data.KonfettiTransactionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// TODO: improve transactional security
@Service
public class AccountingServiceImpl extends BaseService implements AccountingService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AccountingServiceImpl.class);
	
    public AccountingServiceImpl() {
    }

    @Autowired
    public AccountingServiceImpl(AccountRepository accountRepository, KonfettiTransactionRepository konfettiTransactionRepository) {
        this.accountRepository = accountRepository;
        this.konfettiTransactionRepository = konfettiTransactionRepository;
    }

	@Override
	public Long getBalanceOfAccount(String accountName) {
		Account account = accountRepository.findByName(accountName);
		if (account==null) return null;
		return account.getBalance();
	}

	@Override
	public boolean createAccount(String accountName) throws Exception {
		Account account = new Account();
		account.setName(accountName);
        return (accountRepository.saveAndFlush(account)!=null);
	}

	@Override
	public synchronized boolean deleteAccount(String accountName) throws Exception {
		Account account = accountRepository.findByName(accountName);
		if (account==null) throw new Exception("deleteAccount("+accountName+") --> account does not exist");
		accountRepository.delete(account.getId());
		accountRepository.flush();
		return true;
	}

	/**
	 * 
	 * @param transactionType --> use FINALS from KonfettiTransaction
	 * @param fromAccountName
	 * @param toAccountName
	 * @param amount
	 * @return
	 * @throws Exception
	 */
	@Override
	public synchronized boolean transfereBetweenAccounts(Integer transactionType, String fromAccountName, String toAccountName, long amount) throws Exception {
		
		if (amount<=0) throw new Exception("transfereBetweenAccounts("+fromAccountName+", "+toAccountName+", "+amount+") --> invalid amount");
		
		Account from = accountRepository.findByName(fromAccountName);
		Account to = accountRepository.findByName(toAccountName);
		
		// check accounts exist
		if (from==null) throw new Exception("transfereBetweenAccounts("+fromAccountName+", "+toAccountName+", "+amount+") --> from account does not exist");
		if (to==null) throw new Exception("transfereBetweenAccounts("+fromAccountName+", "+toAccountName+", "+amount+") --> to account does not exist");
		
		// from account has enough balance
		if (from.getBalance()<amount) throw new Exception("transfereBetweenAccounts("+fromAccountName+", "+toAccountName+", "+amount+") --> from account has too low blanance of "+from.getName());
		

		// transfer amount
		from.removeBalance(amount);
		to.addBalance(amount);
		
		// persist
		accountRepository.saveAndFlush(from);
		accountRepository.save(to);
		
		// store transaction
		KonfettiTransaction konfettiTransaction = new KonfettiTransaction();
		konfettiTransaction.setType(transactionType);
		konfettiTransaction.setTimestamp(System.currentTimeMillis());
		konfettiTransaction.setFromAccount(fromAccountName);
		konfettiTransaction.setToAccount(toAccountName);
		konfettiTransaction.setAmount(amount);
		konfettiTransaction = this.konfettiTransactionRepository.saveAndFlush(konfettiTransaction);
		
		return true;
	}

	@Override
	public synchronized Long addBalanceToAccount(Integer transactionType, String accountName, long amount) throws Exception {
		
		// check input
		if (amount<=0) throw new Exception("addBalanceToAccount("+accountName+","+amount+") -> invalid amount");
		
		// get account
		Account account = accountRepository.findByName(accountName);
		if (account==null) throw new Exception("addBalanceToAccount("+accountName+","+amount+") --> account does not exist");
		
		// add amount and persist
		account.addBalance(amount);
		accountRepository.saveAndFlush(account);
		
		// store transaction
		KonfettiTransaction konfettiTransaction = new KonfettiTransaction();
		konfettiTransaction.setType(transactionType);
		konfettiTransaction.setTimestamp(System.currentTimeMillis());
		konfettiTransaction.setToAccount(accountName);
		konfettiTransaction.setAmount(amount);
		konfettiTransaction = this.konfettiTransactionRepository.saveAndFlush(konfettiTransaction);
		
		return account.getBalance();
	}

	@Override
	public Account findAccountByName(String name) {
		return accountRepository.findByName(name);
	}

	public synchronized Long removeBalanceFromAccount(Integer transactionType, String accountName, long amount) throws Exception {
		
		// check input
		if (amount<=0) throw new Exception("removeBalanceFromAccount("+accountName+","+amount+") -> invalid amount");
		
		// get account
		Account account = accountRepository.findByName(accountName);
		if (account==null) throw new Exception("removeBalanceToAccount("+accountName+","+amount+") --> account does not exist");
		
		// add amount and persist
		account.removeBalance(amount);
		accountRepository.saveAndFlush(account);
		return account.getBalance();
	}

	private List<Account> getAllAccounts() {
		 return accountRepository.findAll();
	}

	@Override
	public Long getAllKonfettiBalance() {
		long count = 0l;
		List<Account> accounts = accountRepository.findAll();
		for (Account account : accounts) {
			count += account.getBalance();
		}
		return count;
	}

	@Override
	public Long getBalanceEarnedOfAccount(String accountName) {

		// get all Transactions of Account
		List<KonfettiTransaction> accountTransactions = this.getAllTransactionsOfAccount(accountName);

		// calculate inserted, earned and spend
		CumulatedTransations cumulatedTransations = this.cumulateTransaction(accountTransactions, accountName);

		// first calculate all the spend konfetti against the inserted konfetti
		long spendAfterInsertes = cumulatedTransations.spend - cumulatedTransations.inserted;

		// if there are still spend konfetti remove them from the earned konfetti
		if (spendAfterInsertes>0l) cumulatedTransations.earned -= spendAfterInsertes;

		return cumulatedTransations.earned;
	}

	public class CumulatedTransations {
		public long earned = 0l;
		public long inserted = 0l;
		public long spend = 0l;
	}

	public CumulatedTransations cumulateTransaction(List<KonfettiTransaction> accountTransactions, String accountName) {

		CumulatedTransations result = new CumulatedTransations();

		for (KonfettiTransaction konfettiTransaction : accountTransactions) {

			if (konfettiTransaction.getFromAccount().equals(accountName)) {

				if (konfettiTransaction.getAmount()>0l) {
					result.spend += konfettiTransaction.getAmount();
				} else {
					LOGGER.warn("negative transaction send from user - check why #"+konfettiTransaction.getId());
				}

			} else if (konfettiTransaction.getToAccount().equals(accountName)) {

				if (konfettiTransaction.getAmount()>0l) {

					// differ between konfetti earned doing a task and inserted
					if (konfettiTransaction.getType()==KonfettiTransaction.TYPE_TASKREWARD) {
						result.earned += konfettiTransaction.getAmount();
					} else {
						result.inserted += konfettiTransaction.getAmount();
					}

				} else {
					LOGGER.warn("negative transaction send to user - check why #"+konfettiTransaction.getId());
				}

			}

		}

		return result;
	}

	private List<KonfettiTransaction> getAllTransactionsOfAccount(String accountName) {
		// TODO improve performance when getting from persistence - just get all and filter is not a good way
		List<KonfettiTransaction> allTransactions = this.konfettiTransactionRepository.findAll();
		List<KonfettiTransaction> results = new Vector<KonfettiTransaction>();
		for (KonfettiTransaction konfettiTransaction : allTransactions) {
			if (konfettiTransaction.getFromAccount().equals(accountName)) results.add(konfettiTransaction);
			if (konfettiTransaction.getToAccount().equals(accountName)) results.add(konfettiTransaction);
		}
		return results;
	}

}
