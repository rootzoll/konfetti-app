package de.konfetti.data;

import java.util.Random;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class Code {

    private static Random randomGenerator = new Random();
	
	public static final int ACTION_TYPE_KONFETTI = 0; 
	
	public static final int ACTION_TYPE_ADMIN = 1; 
	public static final int ACTION_TYPE_REVIEWER = 2; 
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
	// the time of creation
    private Long timestamp;
    
    // the party the code belongs to
    private Long partyID;
    
    // creator of coupon
    private Long userID;
    
    // the code of the coupon - normally just a number - but could be also string
    @Column(unique=true)
    private String code;
    
    // what kind of action is behind this 
    private int actionType = ACTION_TYPE_KONFETTI;
    
    // amount of konfetti (when actionType => 0)
    private Long amount;
	
    /*
     * UTIL
     */
    
    public static Long generadeCodeNumber() {
    	long rand = randomGenerator.nextLong();
    	if (rand<0) rand = -rand;
    	return ( rand % 8999999999l) + 1000000000l;
    }
    
    /*
     * METHODS
     */
    
    public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(Long timestamp) {
		this.timestamp = timestamp;
	}

	public Long getPartyID() {
		return partyID;
	}

	public void setPartyID(Long partyID) {
		this.partyID = partyID;
	}

	public Long getUserID() {
		return userID;
	}

	public void setUserID(Long userID) {
		this.userID = userID;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public int getActionType() {
		return actionType;
	}

	public void setActionType(Integer actionType) {
		this.actionType = actionType;
	}

	public Long getAmount() {
		return amount;
	}

	public void setAmount(Long amount) {
		this.amount = amount;
	}
	
	public static void main(String[] args) {
		for (int i=0; i<1000; i++) {
			System.out.println(generadeCodeNumber());
		}
	}
}
