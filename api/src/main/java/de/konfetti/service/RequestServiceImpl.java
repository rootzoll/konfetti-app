package de.konfetti.service;

import de.konfetti.data.*;

import de.konfetti.service.exception.ServiceException;
import de.konfetti.utils.AccountingTools;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import javax.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

import static de.konfetti.utils.Helper.nonnull;

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

        getPartyOrThrowError(request.getPartyId());

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
        nonnull(request);

        Party dbParty = getPartyOrThrowError(request.getPartyId());

        Request dbRequest = getRequestOrThrowError(dbParty.getId(), request.getId());

        // update the fields TODO: could be done with entityManager merge??
        dbRequest.setTitle(request.getTitle());
        dbRequest.setImageMediaID(request.getImageMediaID());
        dbRequest.setTime(request.getTime());
        dbRequest.setKonfettiAdd(request.getKonfettiAdd());
        dbRequest.setKonfettiCount(request.getKonfettiCount());

        return requestRepository.saveAndFlush(dbRequest);
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
    	
    	List<Request> partyRequests = requestRepository.findByPartyId(partyId);
    	List<Request> result = new ArrayList<Request>();
    	
    	for (Request request : partyRequests) {
            // get account balance of request
            Long requestBalance = 0l;
            final String requestAccountName = AccountingTools.getAccountNameFromRequest(request.getId());

            Account account = accountRepository.findByName(requestAccountName);
            requestBalance = account.getBalance();

            request.setKonfettiCount(requestBalance);

            // get multi language media item
            if (request.getTitleMultiLangRef()!=null) {
                request.setTitleMultiLang(mediaRepository.findOne(request.getTitleMultiLangRef()));
            }

            // add to result set
            result.add(request);
		}
    	
    	return result;
    }
    
    @Override
    public Request findById(long requestId) {
        return requestRepository.findOne(requestId);
    }
    

	// TODO improve performance
	@Override
	public Long getNumberOfRequests() {
		return (long) requestRepository.findAll().size();
	}
}
