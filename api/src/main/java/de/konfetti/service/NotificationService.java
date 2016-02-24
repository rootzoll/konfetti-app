package de.konfetti.service;

import java.util.List;

import de.konfetti.data.Notification;

public interface NotificationService {

    Notification create(Integer type, Long userId, Long partyId, Long ref);

    void delete(long notiId);
    
    Notification findById(long notiId);
       
    List<Notification> getAllNotifications();
    
    List<Notification> getAllNotifications(Long userId, Long partyId);
    
    List<Notification> getAllNotificationsSince(Long userId, Long partyId, Long sinceTimestamp, boolean deleteOlder);
    
}