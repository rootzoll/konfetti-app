package de.konfetti.data;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/*
 * Adapter to persist notification objects on JPA   
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {
	List<Notification> findByUserIdAndPartyId(Long userId, Long partyId);

	List<Notification> findByUserIdAndPartyIdAndTimeStampGreaterThan(Long userId, Long partyId, Long timestamp);

	Long deleteByUserIdAndPartyIdAndTimeStampLessThan(Long userId, Long partyId, Long sinceTimestamp);

	List<Notification> findByHigherPushDone(Boolean higherPushDone);
}
