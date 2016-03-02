package de.konfetti.service;

import de.konfetti.data.Account;
import de.konfetti.data.AccountRepository;
import de.konfetti.data.MediaRepository;
import de.konfetti.data.PartyRepository;
import de.konfetti.data.Request;
import de.konfetti.data.RequestRepository;

import de.konfetti.service.exception.ServiceException;

import de.konfetti.utils.AccountingTools;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import javax.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

@Service
@Validated
public class RequestServiceImpl extends BaseService implements RequestService {

    public RequestServiceImpl() {
    }

    @Autowired
    public RequestServiceImpl(PartyRepository partyRepository, RequestRepository requestRepository, AccountRepository accountRepository, MediaRepository mediaRepository) {
        this.partyRepository = partyRepository;
        this.requestRepository = requestRepository;
        this.accountRepository = accountRepository;
        this.mediaRepository = mediaRepository;
    }

    @Override
    public Request create(@NotNull Request request) {

        Long requestId = request.getId();
        if (requestId != null && requestId > 0) {
            throw new ServiceException(
                    String.format("The id cannot be set for create request"));
        }

        request.setId(null);

        return requestRepository.saveAndFlush(request);
    }

    @Override
    public Request update(@NotNull Request request) {
        return requestRepository.saveAndFlush(request);
    }

    @Override
    public Request delete(@NotNull long requestId) {
    	
        // make sure the request exists
        Request dbRequest = requestRepository.findOne(requestId);
        if (dbRequest == null) {
            // we suppose the request was deleted before, all okay
            return null;
        }

        requestRepository.delete(dbRequest.getId());
        requestRepository.flush();
        return dbRequest;
    }

    @Override
    public List<Request> getAllPartyRequests(@NotNull long partyId) {
    	
    	// TODO: improve performance for production
    	
    	List<Request> all = getAll();
    	List<Request> result = new ArrayList<Request>();
    	
    	List<Account> allAccounts = accountRepository.findAll();
    	
    	Long partyID = new Long(partyId);
    	for (Request request : all) {
			if (partyID.equals(request.getPartyId())) {
				
				// get account balance of request
				Long requestBalance = 0l;
				final String requestAccountName = AccountingTools.getAccountNameFromRequest(request.getId()); 
				for (Account account : allAccounts) {
					if (requestAccountName.equals(account.getName())) {
						requestBalance = account.getBalance();
						break;
					}
				}
				request.setKonfettiCount(requestBalance);
				
				// get multi language media item
				if (request.getTitleMultiLangRef()!=null) {
					request.setTitleMultiLang(mediaRepository.findOne(request.getTitleMultiLangRef()));
				}
				
				// add to result set
				result.add(request);
			}
		}
    	
    	return result;
    }
    
    @Override
    public Request findById(long requestId) {
        return requestRepository.findOne(requestId);
    }
    
    private List<Request> getAll() {
    	return requestRepository.findAll();
    }
}
