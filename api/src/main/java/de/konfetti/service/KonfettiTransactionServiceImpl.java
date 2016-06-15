package de.konfetti.service;

import de.konfetti.data.KonfettiTransaction;
import de.konfetti.data.KonfettiTransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class KonfettiTransactionServiceImpl extends BaseService implements KonfettiTransactionService {

	@Autowired
	public KonfettiTransactionServiceImpl(KonfettiTransactionRepository transactionRepository) {
        this.konfettiTransactionRepository = transactionRepository;
    }

	@Override
	public KonfettiTransaction store(Integer type, String fromAccount, String toAmount, Long konfettiAmount, String additionalDataJSON) {
		KonfettiTransaction konfettiTransaction = new KonfettiTransaction();
		konfettiTransaction.setType(type);
		konfettiTransaction.setTimestamp(System.currentTimeMillis());
		konfettiTransaction.setToAccount(toAmount);
		konfettiTransaction.setAmount(konfettiAmount);
		if (fromAccount!=null) konfettiTransaction.setFromAccount(fromAccount);
		if (additionalDataJSON!=null) konfettiTransaction.setMetaDataJSON(additionalDataJSON);
		konfettiTransaction = this.konfettiTransactionRepository.saveAndFlush(konfettiTransaction);
		return konfettiTransaction;
	}

	@Override
	public List<KonfettiTransaction> getAllTransactionsToAccount(String toAccount) {
		return getAllTransactionsToAccountSinceTS(toAccount, null);
	}

	@Override
	public List<KonfettiTransaction> getAllTransactionsFromAccount(String fromAccount) {
		return getAllTransactionsFromAccountSinceTS(fromAccount, null);
	}

	@Override
	public List<KonfettiTransaction> getAllTransactionsFromAccountSinceTS(String fromAccount, Long time) {
		return konfettiTransactionRepository.findByFromAccountAndTimestampGreaterThan(fromAccount, time);
	}

	@Override
	public List<KonfettiTransaction> getAllTransactionsToAccountSinceTS(String toAccount, Long time) {
		return konfettiTransactionRepository.findByToAccountAndTimestampGreaterThan(toAccount, time);
	}

    
}
