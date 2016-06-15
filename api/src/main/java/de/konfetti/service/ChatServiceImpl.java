package de.konfetti.service;

import de.konfetti.data.Chat;
import de.konfetti.data.ChatRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class ChatServiceImpl extends BaseService implements ChatService {

	public ChatServiceImpl() {
	}

    @Autowired
    public ChatServiceImpl(ChatRepository chatRepository) {
        this.chatRepository = chatRepository;
    }
    
    @Override
    public Chat create(Chat chat) {
        Chat persited = chatRepository.saveAndFlush(chat);
		log.info("Chat(" + persited.getId() + ") CREATED");
		return persited;
    }

    @Override
	public Chat findById(Long id) {
		log.info("Chat(" + id + ") READ");
		return chatRepository.findOne(id);
    }

	@Override
	public List<Chat> getAllByRequestId(Long id) {
		return chatRepository.findByRequestId(id);
	}
	
	@Override
	public List<Chat> getAllByUserAndParty(Long userId, Long partyId) {
		// TODO improve performance
		List<Chat> partyChats = chatRepository.findByPartyId(partyId);
		List<Chat> res = new ArrayList<Chat>();
		for (Chat chat : partyChats) {
			boolean isRelevant = false;

			// check if owner or member is user
			if (chat.getHostId().equals(userId)) {
				isRelevant = true;
			}
			Long[] members = chat.getMembers();
			for (Long member : members) {
				if (member.equals(userId)) {
					isRelevant = true;
				}
			}
			if (isRelevant) {
				res.add(chat);
			}
		}
		return res;
	}

	@Override
	public Chat update(Chat chat) {
        Chat persited = chatRepository.saveAndFlush(chat);
		log.info("Chat(" + persited.getId() + ") UPDATED");
		return persited;
	}
    
}
