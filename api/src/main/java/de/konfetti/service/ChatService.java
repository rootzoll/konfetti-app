package de.konfetti.service;

import java.util.List;

import de.konfetti.data.Chat;

public interface ChatService {

    Chat create(Chat chat);

    Chat findById(long id);

	List<Chat> getAllByRequestId(long id);

	Chat update(Chat chat);
    
}