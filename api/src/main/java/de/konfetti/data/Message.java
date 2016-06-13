package de.konfetti.data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

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
    
    /*
     * METHODS
     */

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getTime() {
		return time;
	}

	public void setTime(Long time) {
		this.time = time;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public Long getItemId() {
		return itemId;
	}

	public void setItemId(Long itemId) {
		this.itemId = itemId;
	}

	public Long getChatId() {
		return chatId;
	}

	public void setChatId(Long chatId) {
		this.chatId = chatId;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;

		Message message = (Message) o;

		if (id != null ? !id.equals(message.id) : message.id != null) return false;
		if (chatId != null ? !chatId.equals(message.chatId) : message.chatId != null) return false;
		if (time != null ? !time.equals(message.time) : message.time != null) return false;
		if (userId != null ? !userId.equals(message.userId) : message.userId != null) return false;
		return itemId != null ? itemId.equals(message.itemId) : message.itemId == null;

	}

	@Override
	public int hashCode() {
		int result = id != null ? id.hashCode() : 0;
		result = 31 * result + (chatId != null ? chatId.hashCode() : 0);
		result = 31 * result + (time != null ? time.hashCode() : 0);
		result = 31 * result + (userId != null ? userId.hashCode() : 0);
		result = 31 * result + (itemId != null ? itemId.hashCode() : 0);
		return result;
	}
}
