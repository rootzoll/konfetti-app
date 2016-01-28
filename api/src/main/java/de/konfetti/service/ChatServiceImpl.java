package de.konfetti.service;

import java.util.ArrayList;
import java.util.List;

import de.konfetti.data.Chat;
import de.konfetti.data.ChatRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChatServiceImpl extends BaseService implements ChatService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ChatServiceImpl.class);

    public ChatServiceImpl() {
    }

    @Autowired
    public ChatServiceImpl(ChatRepository chatRepository) {
        this.chatRepository = chatRepository;
    }
    
    @Override
    public Chat create(Chat chat) {
    	
        Chat persited = chatRepository.saveAndFlush(chat);
        LOGGER.info("Chat("+persited.getId()+") CREATED"); 
        return persited;
    }

    @Override
    public Chat findById(long id) {
		
    	LOGGER.info("Chat("+id+") READ"); 
        return chatRepository.findOne(id);
    }

	@Override
	public List<Chat> getAllByRequestId(long id) {
		List<Chat> all = chatRepository.findAll();
		List<Chat> res = new ArrayList<Chat>();
		Long ID = new Long(id);
		for (Chat chat : all) {
			if (ID.equals(chat.getRequestId())) res.add(chat); 
		}
		return res;
	}

	@Override
	public Chat update(Chat chat) {
        Chat persited = chatRepository.saveAndFlush(chat);
        LOGGER.info("Chat("+persited.getId()+") UPDATED"); 
        return persited;
	}
    
}
