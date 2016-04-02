package de.konfetti.service;

import java.util.List;

import de.konfetti.data.Account;
import de.konfetti.data.AccountRepository;
import de.konfetti.data.KonfettiTransaction;
import de.konfetti.data.KonfettiTransactionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

// TODO: improve transactional security
@Service
public class AccountingServiceImpl extends BaseService implements AccountingService {

    //private static final Logger LOGGER = LoggerFactory.getLogger(AccountingServiceImpl.class);
	
    public AccountingServiceImpl() {
    }

    @Autowired
    public AccountingServiceImpl(AccountRepository accountRepository, KonfettiTransactionRepository konfettiTransactionRepository) {
        this.accountRepository = accountRepository;
        this.konfettiTransactionRepository = konfettiTransactionRepository;
    }

	@Override
	public Long getBalanceOfAccount(String accountName) {
		Account account = getAccountByName(accountName);
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
		Account account = getAccountByName(accountName);
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
		
		Account from = getAccountByName(fromAccountName);
		Account to = getAccountByName(toAccountName);
		
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
		Account account = getAccountByName(accountName);
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

	public synchronized Long removeBalanceFromAccount(Integer transactionType, String accountName, long amount) throws Exception {
		
		// check input
		if (amount<=0) throw new Exception("removeBalanceFromAccount("+accountName+","+amount+") -> invalid amount");
		
		// get account
		Account account = getAccountByName(accountName);
		if (account==null) throw new Exception("removeBalanceToAccount("+accountName+","+amount+") --> account does not exist");
		
		// add amount and persist
		account.removeBalance(amount);
		accountRepository.saveAndFlush(account);
		return account.getBalance();
	}
	
	private Account getAccountByName(String accountName) {
		// TODO: improve performance by search index for production
		if (accountName==null) return null;
		List<Account> all = getAllAccounts();
		for (Account account : all) {
			if (account.getName().equals(accountName)) return account;
		}
		return null;
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
    
}
