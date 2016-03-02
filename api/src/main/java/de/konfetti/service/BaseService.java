package de.konfetti.service;

import de.konfetti.data.*;


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

}
