package de.konfetti.data;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Data
@Entity
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long chatId;
    
    // server time stamp of message
    private Long time;
    
    // author user id of message
    private Long userId;
    
    // the id of the MediaItem
    private Long itemId;
}
