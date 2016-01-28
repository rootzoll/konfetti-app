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
        LOGGER.info("Message("+persited.getId()+") CREATED"); 
        return persited;
        
    }

    @Override
    public Message findById(long id) {
		LOGGER.info("Message("+id+") READ"); 
        return messageRepository.findOne(id);
    
    }

	@Override
	public List<Message> getAllMessagesOfChat(long id) {
		// TODO improve perfomance
		Long ID = new Long(id);
		List<Message> all = messageRepository.findAll();
		List<Message> res = new ArrayList<Message>();
		for (Message message : all) {
			if (ID.equals(message.getChatId())) res.add(message);
		}
		return res;
	}
    
}
