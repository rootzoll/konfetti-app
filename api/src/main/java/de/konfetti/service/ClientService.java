package de.konfetti.service;

import de.konfetti.data.Client;

public interface ClientService {

    Client create(Long userId);

    Client findById(long client);
    
}