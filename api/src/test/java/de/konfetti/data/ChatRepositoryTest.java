package de.konfetti.data;

import de.konfetti.service.BaseTest;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.junit.Assert.*;

/**
 * Created by relampago on 12.06.16.
 */
public class ChatRepositoryTest extends BaseTest {

    @Autowired
    private ChatRepository chatRepository;

    private Long requestIdOne = new Long(1l);
    private Long requestIdTwo = new Long(2l);
    private Long partyIdOne = new Long(1l);
    private Long partyIdTwo = new Long(2l);

    @Test
    public void findByRequestId() throws Exception {
        createChat(requestIdOne, partyIdOne);
        createChat(requestIdTwo, partyIdTwo);
        List<Chat> foundChats = chatRepository.findByRequestId(requestIdOne);
        assertEquals("found one chat with requestId", 1, foundChats.size());
    }

    @Test
    public void findByPartyId() throws Exception {
        createChat(requestIdOne, partyIdOne);
        createChat(requestIdTwo, partyIdTwo);
        List<Chat> foundChats = chatRepository.findByPartyId(partyIdOne);
        assertEquals("found one chat with partyId", 1, foundChats.size());
    }


    private void createChat(Long requestId, Long partyId) {
        Chat chat = new Chat();
        chat.setRequestId(requestId);
        chat.setPartyId(partyId);
        chatRepository.save(chat);
    }

}