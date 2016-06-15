package de.konfetti.service;

import de.konfetti.data.Notification;
import de.konfetti.data.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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
    public Notification create(Integer type, Long userId, Long partyId, Long ref) {
    	
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
		
		// TODO: improve performance !!
		
		List<Notification> all = getAllNotifications();
		List<Notification> result = new ArrayList<Notification>();
		for (Notification notification : all) {
			if ((notification.getPartyId().equals(partyId)) && (notification.getUserId()!=null) && (notification.getUserId().equals(userId))) result.add(notification);
		}
		return result;
	}

	@Override
	public List<Notification> getAllNotificationsSince(Long userId,Long partyId, Long sinceTimestamp, boolean deleteOlder) {
		
		// TODO: improve performance !!
		
		List<Notification> allUserOnParty = getAllNotifications(userId, partyId);
		List<Notification> result = new ArrayList<Notification>();
		for (Notification notification : allUserOnParty) {
			if (notification.getTimeStamp()>sinceTimestamp) {
				result.add(notification);
			} else {
				if ((deleteOlder) && (!notification.needsManualDeletion())) delete(notification.getId());
			}
		}
		return result;
	}

	@Override
	public List<Notification> getAllPossiblePushNotifications() {
		
		// TODO: improve performance !!

		List<Notification> allNotifications= getAllNotifications();
		List<Notification> result = new ArrayList<Notification>();
		for (Notification notification : allNotifications) {
			if (!notification.getHigherPushDone()) {
				result.add(notification);
			}
		}
		return result;
	}

	@Override
	public void setNotificationAsPushProcessed(Long id) {
		
		Notification notification = findById(id);
		notification.setHigherPushDone(true);
		notificationRepository.saveAndFlush(notification);
		
	}

	@Override
	public void deleteByTypeAndReference(Integer type, Long referenceValue) {
		
		List<Notification> allNotifications = getAllPossiblePushNotifications();
		for (Notification notification : allNotifications) {
			//LOGGER.info("type("+notification.getType()+") ref("+notification.getRef()+")");
			if (type.equals(notification.getType()) && referenceValue.equals(notification.getRef())) {
				log.info("deleteByTypeAndReference(" + type + "," + referenceValue + "): Deleting Notification(" + notification.getId() + ")");
				delete(notification.getId());
				return;
			}
		}

		log.info("deleteByTypeAndReference(" + type + "," + referenceValue + "): not found");
		
	}
    
}
