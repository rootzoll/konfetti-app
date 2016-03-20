package de.konfetti.data;

import javax.persistence.*;

@Entity
public class User {
	
	/*
	 * OBJECT DATA FIELDS
	 * 
	 * data fields relevant to the user object
	 */
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // self written name (nick or real)
    private String name;
    
    // email
    private String eMail;
    
    // password
    private String password;
    
    // image of user 
    private Long imageMediaID;
    
	// list of languages the user speaks (e.g. 'de', 'en', 'ar')
    private String[] spokenLangs = {};
    
    // IDs of parties the user has an konfetti balance on
    private Long[] activeOnParties = {};
    
    // IDs of parties the user has admin privileges on
    private Long[] adminOnParties = {};
    
    // IDs of parties the user has reviewer privileges on
    private Long[] reviewerOnParties = {};
    
    // time stamp when the user last was online (not more precise 1 minute)
    private Long lastActivityTS = 0l;
    
    /*
     * PUSH MESSAGING
     */
    
    public static final String PUSHSYSTEM_IOS = "ios";
    public static final String PUSHSYSTEM_ANDROID = "android";
    public static final String PUSHSYSTEM_CHROME = "chrome";
    
    private Boolean pushActive = false;
    
    private String pushSystem;
    
    private String pushID;
    
    /*
     * REST DELIVERY DATA
     * 
     * the following values are used to deliver the user together with
     * relevant client info to client on user REST end point
     */

    @Transient // multiple client can exists per user
    private Long clientId;

    @Transient // is persistent on client object
    private String clientSecret;

    /*
     * METHODS 
     */
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String secret) {
        this.clientSecret = secret;
    }

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

    public Long getImageMediaID() {
		return imageMediaID;
	}

	public void setImageMediaID(Long imageMediaID) {
		this.imageMediaID = imageMediaID;
	}

	public String[] getSpokenLangs() {
		return spokenLangs;
	}

	public void setSpokenLangs(String[] spokenLangs) {
		this.spokenLangs = spokenLangs;
	}

	public Long[] getActiveOnParties() {
		return activeOnParties;
	}

	public void setActiveOnParties(Long[] activeOnParties) {
		this.activeOnParties = activeOnParties;
	}

	public Long[] getAdminOnParties() {
		return adminOnParties;
	}

	public void setAdminOnParties(Long[] adminOnParties) {
		this.adminOnParties = adminOnParties;
	}

	public Long[] getReviewerOnParties() {
		return reviewerOnParties;
	}

	public void setReviewerOnParties(Long[] reviewerOnParties) {
		this.reviewerOnParties = reviewerOnParties;
	}

	public Boolean getPushActive() {
		return pushActive;
	}

	public void setPushActive(Boolean pushActive) {
		this.pushActive = pushActive;
	}

	public String getPushSystem() {
		return pushSystem;
	}

	public void setPushSystem(String pushSystem) {
		this.pushSystem = pushSystem;
	}

	public String getPushID() {
		return pushID;
	}

	public void setPushID(String pushID) {
		this.pushID = pushID;
	}

	public String geteMail() {
		return eMail;
	}

	public void seteMail(String eMail) {
		this.eMail = eMail;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public Long getLastActivityTS() {
		return lastActivityTS;
	}

	public void setLastActivityTS(Long lastActivityTS) {
		this.lastActivityTS = lastActivityTS;
	}
	
	public boolean wasUserActiveInLastMinutes(int minutes) {
		long minutesSinceLastActivity = Math.round((System.currentTimeMillis() - this.lastActivityTS) / (60d*1000d));
		boolean wasUserActiveInLastMinutes = ((minutesSinceLastActivity==0) || (minutes>=minutesSinceLastActivity));
		//System.out.println("wasUserActiveInLastMinutes("+minutes+") : User("+this.id+") lastActivity old ("+minutesSinceLastActivity+")min <= "+minutes+" --> "+wasUserActiveInLastMinutes);
		return wasUserActiveInLastMinutes;
	}
    
}

