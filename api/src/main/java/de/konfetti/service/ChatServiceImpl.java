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
		
		// TODO: improve performance
		
		List<Chat> all = chatRepository.findAll();
		List<Chat> res = new ArrayList<Chat>();
		Long ID = new Long(id);
		for (Chat chat : all) {
			if (ID.equals(chat.getRequestId())) res.add(chat); 
		}
		return res;
	}
	
	@Override
	public List<Chat> getAllByUserAndParty(long userId, long partyId) {
		
		// TODO improve performance
		
		List<Chat> all = chatRepository.findAll();
		List<Chat> res = new ArrayList<Chat>();
		Long userID = new Long(userId);
		Long partyID = new Long(partyId);
		for (Chat chat : all) {
			
			boolean isRelevant = false;
			
			// a) check if chat belongs to party
			if (!chat.getPartyId().equals(partyID)) continue;
			
			// b) check if owner or member is user
			if (chat.getHostId().equals(userID)) isRelevant = true;
			Long[] members = chat.getMembers();
			for (int i=0; i<members.length; i++) {
				if (members[i].equals(userID)) isRelevant = true;
			}
			
			if (isRelevant) res.add(chat); 
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
