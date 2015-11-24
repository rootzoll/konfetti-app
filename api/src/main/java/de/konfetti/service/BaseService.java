package de.konfetti.service;

import de.konfetti.data.*;

import javax.validation.constraints.NotNull;

/**
 * Created by relampago on 09.11.15.
 */
public class BaseService {

    protected PartyRepository partyRepository;

    protected RequestRepository requestRepository;

    protected UserRepository userRepository;

    public BaseService() {
    }

    protected Party getPartyOrThrowError(@NotNull long partyId) {
        Party dbParty = partyRepository.findOne(partyId);
        if (dbParty == null)
            throw new IllegalArgumentException("Party cannot be found with the given ID : " + partyId);
        return dbParty;
    }

    protected Request getRequestOrThrowError(@NotNull long partyId , @NotNull long requestId) {
        Request dbRequest = requestRepository.findOne(requestId);
        if (dbRequest == null)
            throw new IllegalArgumentException("Request cannot be found with the given ID : " + requestId);

        // make sure the request belongs to the given party
        if (!dbRequest.getParty().getId().equals(partyId))
            throw new IllegalArgumentException("Request does not belong to the given party with ID : " + partyId);

        return dbRequest;
    }
}
