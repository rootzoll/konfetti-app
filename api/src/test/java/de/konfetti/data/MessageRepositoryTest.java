package de.konfetti.data;

import de.konfetti.service.BaseTest;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.junit.Assert.assertEquals;

/**
 * Created by relampago on 12.06.16.
 */
public class MessageRepositoryTest extends BaseTest {

    @Autowired
    private MessageRepository messageRepository;

    private Long chatIdOne = 1L;
    private Long chatIdTwo = 2L;


    @Test
    public void findByEMail() throws Exception {
		final Message message1 = createMessage(chatIdOne, 0L);
		final Message message2 = createMessage(chatIdTwo, 0L);

		List<Message> list = messageRepository.findByChatId(chatIdOne);
        assertEquals(list.size(), 1);
        assertEquals(list.get(0), message1);
    }

    @Test
    public void findByChatAndTime() throws Exception {
		final Message message1 = createMessage(chatIdOne, 1000L);
		final Message message2 = createMessage(chatIdOne, 10000L);

		List<Message> list = messageRepository.findByChatIdAndTimeGreaterThan(chatIdOne, 1000L);
		assertEquals(list.size(), 1);
		assertEquals(list.get(0), message2);
    }

    private Message createMessage(Long chatId, Long time){
        Message message = new Message();
        message.setChatId(chatId);
        message.setTime(time);
        return messageRepository.save(message);
    }

}