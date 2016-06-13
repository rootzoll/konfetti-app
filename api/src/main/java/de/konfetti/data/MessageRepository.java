package de.konfetti.data;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/*
 * Adapter to persist notification objects on JPA   
 */
public interface MessageRepository extends JpaRepository<Message, Long> {

	List<Message> findByChatId(Long chatId);

	List<Message> findByChatIdAndTimeGreaterThan(Long chatId, Long time);
}
