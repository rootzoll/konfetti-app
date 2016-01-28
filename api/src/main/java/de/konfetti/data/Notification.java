package de.konfetti.data;

import javax.persistence.*;

@Entity
public class Notification {
	
	public static final Integer TYPE_MEDIAITEM_FULL = 0;
	public static final Integer TYPE_MEDIAITEM_INFO = 1;
	public static final Integer TYPE_REVIEW_OK 		= 2;
	public static final Integer TYPE_REVIEW_FAIL 	= 4;
	public static final Integer TYPE_CHAT_NEW 		= 5;
	
    // sample from app { id: 12, userId: 1, partyId: 2, type:1, ref:0 }
	
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
    
    /*
     * METHODS 
     */
    
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

}

