package de.konfetti.service;

import de.konfetti.data.KonfettiTransaction;
import de.konfetti.data.KonfettiTransactionRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class KonfettiTransactionServiceImpl extends BaseService implements KonfettiTransactionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ClientServiceImpl.class);

    public KonfettiTransactionServiceImpl() {
    }

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
		
		// TODO optimize performance - maybe use TS to work with cache
		LOGGER.warn("TODO: getAllTransactionsToAccount optimze performance");
		
		List<KonfettiTransaction> allTransactions = this.konfettiTransactionRepository.findAll();
		List<KonfettiTransaction> results = new ArrayList<KonfettiTransaction>();
		for (KonfettiTransaction konfettiTransaction : allTransactions) {
			if ((time!=null) && (time>konfettiTransaction.getTimestamp())) continue; 
			if ((konfettiTransaction.getFromAccount()!=null) && (konfettiTransaction.getFromAccount().equals(fromAccount))) results.add(konfettiTransaction);
		}
		return results;
	}

	@Override
	public List<KonfettiTransaction> getAllTransactionsToAccountSinceTS(String toAccount, Long time) {
		
		// TODO optimize performance - maybe use TS to work with cache
		LOGGER.warn("TODO: getAllTransactionsToAccount optimze performance");
		
		List<KonfettiTransaction> allTransactions = this.konfettiTransactionRepository.findAll();
		List<KonfettiTransaction> results = new ArrayList<KonfettiTransaction>();
		for (KonfettiTransaction konfettiTransaction : allTransactions) {
			if ((time!=null) && (time>konfettiTransaction.getTimestamp())) continue; 
			if (konfettiTransaction.getToAccount().equals(toAccount)) results.add(konfettiTransaction);
		}
		return results;
	}

    
}
