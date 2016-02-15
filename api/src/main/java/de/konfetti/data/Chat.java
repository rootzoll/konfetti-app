package de.konfetti.data;

import java.util.List;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Transient;

@Entity
public class Chat {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // the request this chat belongs to (if possible keep optional)
    private Long requestId;
    
    // the admin / initiator of the chat ... the userId
    private Long hostId;
    
    // other userIds part of the chat
    private Long[] members = {};
    
    // true if the author dont want chat to be displayed anymore
    private Boolean muted = false;
    
    /*
     * TRANSITENT --> just for delivery
     */
    
    @Transient
    private List<Message> messages;

    @Transient
    private Long chatPartnerId;
    
	@Transient
    private String chatPartnerName;
    
	@Transient
    private Long chatPartnerImageMediaID;
	
	@Transient
    private String[] chatPartnerSpokenLangs;
    
    /*
     * METHODS
     */

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getRequestId() {
		return requestId;
	}

	public void setRequestId(Long requestId) {
		this.requestId = requestId;
	}

	public Long getHostId() {
		return hostId;
	}

	public void setHostId(Long hostId) {
		this.hostId = hostId;
	}

	public Long[] getMembers() {
		return members;
	}

	public void setMembers(Long[] members) {
		this.members = members;
	}

	public List<Message> getMessages() {
		return messages;
	}

	public void setMessages(List<Message> messages) {
		this.messages = messages;
	}

	public Boolean getMuted() {
		return muted;
	}

	public void setMuted(Boolean muted) {
		this.muted = muted;
	}
	
    public String getChatPartnerName() {
		return chatPartnerName;
	}

	public void setChatPartnerName(String chatPartnerName) {
		this.chatPartnerName = chatPartnerName;
	}

	public Long getChatPartnerImageMediaID() {
		return chatPartnerImageMediaID;
	}

	public void setChatPartnerImageMediaID(Long chatPartnerImageMediaID) {
		this.chatPartnerImageMediaID = chatPartnerImageMediaID;
	}
	
	public String[] getChatPartnerSpokenLangs() {
		return chatPartnerSpokenLangs;
	}

	public void setChatPartnerSpokenLangs(String[] chatPartnerSpokenLangs) {
		this.chatPartnerSpokenLangs = chatPartnerSpokenLangs;
	}

    public Long getChatPartnerId() {
		return chatPartnerId;
	}

	public void setChatPartnerId(Long chatPartnerId) {
		this.chatPartnerId = chatPartnerId;
	}
}
