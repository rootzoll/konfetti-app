package de.konfetti.service;

import de.konfetti.data.*;

import javax.validation.constraints.NotNull;


public class BaseService {

    protected PartyRepository partyRepository;

    protected RequestRepository requestRepository;

    protected UserRepository userRepository;
    
    protected ClientRepository clientRepository;
    
    protected NotificationRepository notificationRepository;
    
    protected AccountRepository accountRepository;
    
    protected ChatRepository chatRepository;
    
    protected MediaRepository mediaRepository;
    
    protected MessageRepository messageRepository;
   
    protected CodeRepository codeRepository;
    
    protected KonfettiTransactionRepository konfettiTransactionRepository;
    
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
        if (!dbRequest.getPartyId().equals(partyId))
            throw new IllegalArgumentException("Request does not belong to the given party with ID : " + partyId);

        return dbRequest;
    }

}
