package de.konfetti.service;

import de.konfetti.data.Message;
import de.konfetti.data.MessageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class MessageServiceImpl extends BaseService implements MessageService {

	@Autowired
	public MessageServiceImpl(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }
    
    @Override
    public Message create(Message item) {
    	
        Message persited = messageRepository.saveAndFlush(item);
		log.debug("Message(" + persited.getId() + ") CREATED");
		return persited;
        
    }

    @Override
    public Message findById(long id) {
		log.debug("Message(" + id + ") READ");
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
