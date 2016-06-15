package de.konfetti.data;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
@Data
public class Notification {
	
	public static final Integer TYPE_MEDIAITEM_FULL  = 0;
	public static final Integer TYPE_MEDIAITEM_INFO  = 1;
	public static final Integer TYPE_REVIEW_OK 		 = 2;
	public static final Integer TYPE_PAYBACK 		 = 3;
	public static final Integer TYPE_REVIEW_FAIL 	 = 4;
	public static final Integer TYPE_CHAT_NEW 		 = 5;
	public static final Integer TYPE_PARTY_WELCOME 	 = 6;
	public static final Integer TYPE_REWARD_GOT 	 = 7;
	public static final Integer TYPE_SUPPORT_WIN 	 = 8; // when a task you supported got done
	public static final Integer TYPE_LOGOUT_REMINDER = 9; 
	public static final Integer TYPE_REVIEW_WAITING  = 10;
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // every notification belongs to one user
    private Long userId;
    
    // >0 if belonging to a party
    private Long partyId;
    
    // type (see CONST above)
    private Integer type;
    
    // reference - depending on type
    private Long ref;
    
    // time stamp of creation
	private Long timeStamp;

	private Boolean higherPushDone = Boolean.FALSE;

    /*
     * METHODS 
     */
    
	public boolean needsManualDeletion() {
		return TYPE_REWARD_GOT.equals(this.type);
	}

}

