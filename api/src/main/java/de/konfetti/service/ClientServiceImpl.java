package de.konfetti.service;

import de.konfetti.data.Client;
import de.konfetti.data.ClientRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
public class ClientServiceImpl extends BaseService implements ClientService {

    @Autowired
    public ClientServiceImpl(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }
    
    @Override
    public Client create(Long userId) {
    	
    	// client gets created
        Client client = new Client();
        client.setUserId(userId);
        client.setSecret(UUID.randomUUID().toString());

        // persist
        Client persited = clientRepository.saveAndFlush(client);
        
        // return to caller
		log.info("Client(" + persited.getId() + ") CREATED");
		return persited;
        
    }

    @Override
    public Client findById(long id) {

		log.debug("Client(" + id + ") READ");

		// gets the one with the given id
        return clientRepository.findOne(id);
    
    }
    
}
