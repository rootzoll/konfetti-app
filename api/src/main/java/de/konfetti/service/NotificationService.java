package de.konfetti.service;

import java.util.List;

import de.konfetti.data.Notification;

public interface NotificationService {

    Notification create(Long userId, Long partyId, Integer type, Long ref);

    Notification delete(long notiId);
    
    Notification findById(long notiId);
       
    List<Notification> getAllNotifications();
    
    List<Notification> getAllNotifications(Long userId, Long partyId);
    
}