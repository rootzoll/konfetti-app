package de.konfetti.service;

import de.konfetti.data.Chat;

import java.util.List;

public interface ChatService {

    Chat create(Chat chat);

	Chat findById(Long id);

	List<Chat> getAllByRequestId(Long id);

	List<Chat> getAllByUserAndParty(Long userId, Long partyId);

	Chat update(Chat chat);
    
}