package de.konfetti.service;

import de.konfetti.data.Party;
import de.konfetti.data.PartyRepository;
import de.konfetti.data.Request;
import de.konfetti.data.RequestRepository;
import de.konfetti.service.exception.ServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

import static de.konfetti.utils.Helper.nonnull;

/**
 * Created by catarata02 on 08.11.15.
 */
@Service
@Validated
public class RequestServiceImpl extends BaseService implements RequestService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RequestServiceImpl.class);

    public RequestServiceImpl() {
    }

    @Autowired
    public RequestServiceImpl(PartyRepository partyRepository, RequestRepository requestRepository) {
        this.partyRepository = partyRepository;
        this.requestRepository = requestRepository;
    }

    @Override
    public Request create(@NotNull long partyId, @NotNull Request request) {
        nonnull(partyId);

        Party dbParty = getPartyOrThrowError(partyId);

        Long requestId = request.getId();
        if (requestId != null && requestId > 0) {
            throw new ServiceException(
                    String.format("The id cannot be set for create request"));
        }

        request.setId(null);

        return requestRepository.saveAndFlush(request);
    }

    @Override
    public Request update(@NotNull long partyId,@NotNull Request request) {
        nonnull(request);

        Party dbParty = getPartyOrThrowError(partyId);

        Request dbRequest = getRequestOrThrowError(partyId, request.getId());

        // update the fields TODO: could be done with entityManager merge??
        dbRequest.setTitle(request.getTitle());
        dbRequest.setImageUrl(request.getImageUrl());
        dbRequest.setTime(request.getTime());
        dbRequest.setKonfettiAdd(request.getKonfettiAdd());
        dbRequest.setKonfettiCount(request.getKonfettiCount());

        return requestRepository.saveAndFlush(dbRequest);
    }

    @Override
    public Request delete(@NotNull long partyId, @NotNull long requestId) {
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
    public Request get(@NotNull long partyId, @NotNull long requestId) {
        return getRequestOrThrowError(partyId, requestId);
    }

    @Override
    public List<Request> getAllPartyRequests(@NotNull long partyId) {
        return new ArrayList<Request>(getPartyOrThrowError(partyId).getRequestSet());
    }

    @Override
    public Request findById(long requestId) {
        return requestRepository.findOne(requestId);
    }
}
