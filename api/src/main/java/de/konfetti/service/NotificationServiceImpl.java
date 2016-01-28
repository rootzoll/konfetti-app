package de.konfetti.service;

import java.util.ArrayList;
import java.util.List;

import de.konfetti.data.Notification;
import de.konfetti.data.NotificationRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl extends BaseService implements NotificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationServiceImpl.class);

    public NotificationServiceImpl() {
    }

    @Autowired
    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    
    @Override
    public Notification create(Long userId, Long partyId, Integer type, Long ref) {
    	
    	// user gets created
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setPartyId(partyId);
        notification.setType(type);
        notification.setRef(ref);
        
        // user gets persisted and returned to user  
        Notification persited = notificationRepository.saveAndFlush(notification);
        
        // return to caller
		LOGGER.info("Notification("+persited.getId()+") CREATED"); 
        return persited;
        
    }

    @Override
    public Notification findById(long notiId) {
    	
		LOGGER.info("Notification("+notiId+") READ"); 
    	
    	// gets the one with the given id
        return notificationRepository.findOne(notiId);
    
    }

	@Override
	public Notification delete(long notiId) {
		// TODO Auto-generated method stub
		throw new RuntimeException("TODO: implement NotificationServiceImpl.delete()");
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
			if ((notification.getPartyId().equals(partyId)) && (notification.getUserId().equals(userId))) result.add(notification);
		}

		return result;
	}

    
}
