package de.konfetti.data;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatRepository extends JpaRepository<Chat, Long> {

    List<Chat> findByRequestId(Long requestId);

    List<Chat> findByPartyId(Long partyId);

}
