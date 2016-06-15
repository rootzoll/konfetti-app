package de.konfetti.data;

import lombok.Data;

import javax.persistence.*;

@Entity
@Data
public class User {
	
	/*
	 * OBJECT DATA FIELDS
	 * 
	 * data fields relevant to the user object
	 */

	public static final String PUSHSYSTEM_IOS = "ios";
	public static final String PUSHSYSTEM_ANDROID = "android";
	public static final String PUSHSYSTEM_CHROME = "chrome";
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

	/*
	 * PUSH MESSAGING
	 */
	// IDs of parties the user has admin privileges on
    private Long[] adminOnParties = {};
    // IDs of parties the user has reviewer privileges on
    private Long[] reviewerOnParties = {};
    // time stamp when the user last was online (not more precise 1 minute)
    private Long lastActivityTS = 0l;
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
	
	public boolean wasUserActiveInLastMinutes(int minutes) {
		long minutesSinceLastActivity = Math.round((System.currentTimeMillis() - this.lastActivityTS) / (60d*1000d));
		boolean wasUserActiveInLastMinutes = ((minutesSinceLastActivity==0) || (minutes>=minutesSinceLastActivity));
		//System.out.println("wasUserActiveInLastMinutes("+minutes+") : User("+this.id+") lastActivity old ("+minutesSinceLastActivity+")min <= "+minutes+" --> "+wasUserActiveInLastMinutes);
		return wasUserActiveInLastMinutes;
	}
    
}

