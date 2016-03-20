package de.konfetti.data;

import javax.persistence.*;

@Entity
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
    private Long ts;
    
    private Boolean higherPushDone;
    
    /*
     * METHODS 
     */
    
	public boolean needsManualDeletion() {
		if (TYPE_REWARD_GOT.equals(this.type)) return true;
		return false;
	}
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return this.userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

	public Long getPartyId() {
		return partyId;
	}

	public void setPartyId(Long partyId) {
		this.partyId = partyId;
	}

	public Integer getType() {
		return type;
	}

	public void setType(Integer type) {
		this.type = type;
	}

	public Long getRef() {
		return ref;
	}

	public void setRef(Long ref) {
		this.ref = ref;
	}

	public Long getTimeStamp() {
		return ts;
	}

	public void setTimeStamp(Long ts) {
		this.ts = ts;
	}
	
	public boolean getHigherPushDone() {
		if (higherPushDone==null) return false;
		return higherPushDone;
	}

	public void setHigherPushDone(Boolean higherPushDone) {
		this.higherPushDone = higherPushDone;
	}
}

