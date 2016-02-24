package de.konfetti.service;

import java.util.List;

import de.konfetti.data.Message;

public interface MessageService {

	Message create(Message chat);

	Message findById(long id);

	List<Message> getAllMessagesOfChat(long id);
	
	List<Message> getAllMessagesOfChatSince(long id, long ts);
    
}