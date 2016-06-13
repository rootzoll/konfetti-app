package de.konfetti.service;

import java.util.ArrayList;
import java.util.List;

import de.konfetti.data.Message;
import de.konfetti.data.MessageRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MessageServiceImpl extends BaseService implements MessageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MessageServiceImpl.class);

    public MessageServiceImpl() {
    }

    @Autowired
    public MessageServiceImpl(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }
    
    @Override
    public Message create(Message item) {
    	
        Message persited = messageRepository.saveAndFlush(item);
        LOGGER.debug("Message("+persited.getId()+") CREATED"); 
        return persited;
        
    }

    @Override
    public Message findById(long id) {
		LOGGER.debug("Message("+id+") READ"); 
        return messageRepository.findOne(id);
    
    }

	@Override
	public List<Message> getAllMessagesOfChat(long id) {
		return messageRepository.findByChatId(id);
	}

	@Override
	public List<Message> getAllMessagesOfChatSince(long id, long ts) {
		return messageRepository.findByChatIdAndTimeGreaterThan(id, ts);
	}
    
}
