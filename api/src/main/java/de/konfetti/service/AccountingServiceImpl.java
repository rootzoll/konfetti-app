package de.konfetti.service;

import de.konfetti.data.*;
import de.konfetti.service.exception.ServiceException;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// TODO: improve transactional security
@Slf4j
@Service
@Transactional
@NoArgsConstructor
public class AccountingServiceImpl extends BaseService implements AccountingService {

	@Autowired
	public AccountingServiceImpl(AccountRepository accountRepository, KonfettiTransactionRepository konfettiTransactionRepository) {
		this.accountRepository = accountRepository;
		this.konfettiTransactionRepository = konfettiTransactionRepository;
	}

	@Override
	public Long getBalanceOfAccount(String accountName) {
		Account account = accountRepository.findByName(accountName);
		if (account == null) {
			return null;
		}
		return account.getBalance();
	}

	@Override
	public boolean createAccount(String accountName) throws Exception {
		Account account = new Account();
		account.setName(accountName);
		return (accountRepository.saveAndFlush(account) != null);
	}

	@Override
	public synchronized boolean deleteAccount(String accountName) throws Exception {
		Account account = accountRepository.findByName(accountName);
		if (account == null)
			throw new ServiceException("deleteAccount(" + accountName + ") --> account does not exist");
		accountRepository.delete(account.getId());
		accountRepository.flush();
		return true;
	}
	@Override
	public synchronized boolean transferBetweenAccounts(TransactionType transactionType, String fromAccountName, String toAccountName, long amount) throws Exception {

		if (amount <= 0)
			throw new Exception("transferBetweenAccounts(" + fromAccountName + ", " + toAccountName + ", " + amount + ") --> invalid amount");

		Account from = accountRepository.findByName(fromAccountName);
		Account to = accountRepository.findByName(toAccountName);

		// check accounts exist
		if (from == null)
			throw new Exception("transferBetweenAccounts(" + fromAccountName + ", " + toAccountName + ", " + amount + ") --> from account does not exist");
		if (to == null)
			throw new Exception("transferBetweenAccounts(" + fromAccountName + ", " + toAccountName + ", " + amount + ") --> to account does not exist");

		// from account has enough balance
		if (from.getBalance() < amount)
			throw new Exception("transferBetweenAccounts(" + fromAccountName + ", " + toAccountName + ", " + amount + ") --> from account has too low blanance of " + from.getName());


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
	public synchronized Long addBalanceToAccount(TransactionType transactionType, String accountName, long amount) throws Exception {

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

	public synchronized Long removeBalanceFromAccount(TransactionType transactionType, String accountName, long amount) throws Exception {

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
		List<KonfettiTransaction> accountTransactions =
				konfettiTransactionRepository.findByFromAccountOrToAccount(accountName, accountName);

		// calculate inserted, earned and spend
		CumulatedTransations cumulatedTransations = this.cumulateTransaction(accountTransactions, accountName);

		// first calculate all the spend konfetti against the inserted konfetti
		long spendAfterInsertes = cumulatedTransations.spend - cumulatedTransations.inserted;

		// if there are still spend konfetti remove them from the earned konfetti
		if (spendAfterInsertes>0l) cumulatedTransations.earned -= spendAfterInsertes;

		return cumulatedTransations.earned;
	}

	private CumulatedTransations cumulateTransaction(List<KonfettiTransaction> accountTransactions, String accountName) {

		CumulatedTransations result = new CumulatedTransations();

		for (KonfettiTransaction konfettiTransaction : accountTransactions) {

			if (konfettiTransaction.getFromAccount().equals(accountName)) {

				if (konfettiTransaction.getAmount() > 0L) {
					result.spend += konfettiTransaction.getAmount();
				} else {
					log.warn("negative transaction send from user - check why #" + konfettiTransaction.getId());
				}

			} else if (konfettiTransaction.getToAccount().equals(accountName)) {

				if (konfettiTransaction.getAmount() > 0L) {

					// differ between konfetti earned doing a task and inserted
					if (konfettiTransaction.getType() == TransactionType.TASK_REWARD) {
						result.earned += konfettiTransaction.getAmount();
					} else {
						result.inserted += konfettiTransaction.getAmount();
					}

				} else {
					log.warn("negative transaction send to user - check why #" + konfettiTransaction.getId());
				}

			}

		}

		return result;
	}

	private class CumulatedTransations {
		long earned = 0l;
		long inserted = 0l;
		long spend = 0l;
	}

}
