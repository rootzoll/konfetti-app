package de.konfetti.service;

import de.konfetti.data.Notification;
import de.konfetti.data.NotificationRepository;
import de.konfetti.data.NotificationType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class NotificationServiceImpl extends BaseService implements NotificationService {

	public NotificationServiceImpl() {
	}

    @Autowired
    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    
    @Override
	public Notification create(NotificationType type, Long userId, Long partyId, Long ref) {

		// user gets created
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setPartyId(partyId);
        notification.setType(type);
        notification.setRef(ref);
        notification.setTimeStamp(System.currentTimeMillis());
        
        // user gets persisted and returned to user  
        Notification persited = notificationRepository.saveAndFlush(notification);
        
        // return to caller
		log.debug("Notification(" + persited.getId() + ") CREATED");
		return persited;
        
    }

    @Override
    public Notification findById(long notiId) {

		log.debug("Notification(" + notiId + ") READ");

		// gets the one with the given id
        return notificationRepository.findOne(notiId);
    
    }

	@Override
	public void delete(long notiId) {
		notificationRepository.delete(notiId);
	}

	@Override
	public List<Notification> getAllNotifications() {
		return notificationRepository.findAll();
	}

	@Override
	public List<Notification> getAllNotifications(Long userId, Long partyId) {
		return notificationRepository.findByUserIdAndPartyId(userId, partyId);
	}

	@Override
	public void deleteAllNotificationsOlderThan(Long userId, Long partyId, Long sinceTimestamp) {
		notificationRepository.deleteByUserIdAndPartyIdAndTimeStampLessThan(userId, partyId, sinceTimestamp);
	}

	@Override
	public List<Notification> getAllNotificationsSince(Long userId, Long partyId, Long sinceTimestamp) {
		return notificationRepository.findByUserIdAndPartyIdAndTimeStampGreaterThan(userId, partyId, sinceTimestamp);
	}

	@Override
	public List<Notification> getAllPossiblePushNotifications() {
		return notificationRepository.findByHigherPushDone(Boolean.FALSE);
	}

	@Override
	public void setNotificationAsPushProcessed(Long id) {
		
		Notification notification = findById(id);
		notification.setHigherPushDone(true);
		notificationRepository.saveAndFlush(notification);
		
	}

	@Override
	public void deleteByTypeAndReference(NotificationType type, Long referenceValue) {
		
		List<Notification> allNotifications = getAllPossiblePushNotifications();
		for (Notification notification : allNotifications) {
			if (type.equals(notification.getType()) && referenceValue.equals(notification.getRef())) {
				log.info("deleteByTypeAndReference(" + type + "," + referenceValue + "): Deleting Notification(" + notification.getId() + ")");
				delete(notification.getId());
				return;
			}
		}

		log.info("deleteByTypeAndReference(" + type + "," + referenceValue + "): not found");
		
	}
    
}
