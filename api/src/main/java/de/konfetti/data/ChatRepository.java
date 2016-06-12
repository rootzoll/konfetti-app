package de.konfetti.data;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

    List<Chat> findByRequestId(Long requestId);

    List<Chat> findByPartyId(Long partyId);

}
