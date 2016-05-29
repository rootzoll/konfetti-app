package de.konfetti.data;

import javax.persistence.*;

import java.util.Set;

@Entity
public class Party {

	/*
	 * FINAL VISIBILITY VALUES
	 */

    // 0 = default - for everybody to see
	public static final int VISIBILITY_PUBLIC = 0;
    // 1 = can be found but is asking for invitation code
	public static final int VISIBILITY_PRIVATE = 1;
    // 2 = cannot be found, just enter with invitation code
	public static final int VISIBILITY_HIDDEN = 2;
    // -1 = deactivated
	public static final int VISIBILITY_DEACTIVATED = -1;
	
	/*
	 * FINAL REVIEW LEVEL VALUES
	 */
	
	// 0 = no review
	public static final int REVIEWLEVEL_NONE = 0;	
    // 1 = full review of all public posts
	public static final int REVIEWLEVEL_EVERYTHING = 1;
    // 2 = just review the initial task, follow up public info on request no review
	public static final int REVIEWLEVEL_TASKS = 2;
	
	
	/*
	 * KONFETTI SEND MODE
	 */
	
	// sending of konfetti to other users is disabled 
	public static final int SENDKONFETTIMODE_DISABLED = 0;
	// all konfetti can be send to other users/e-mails
	public static final int SENDKONFETTIMODE_ALL = 1;
	// just earned konfetti can be send to other users/e-mails	
	public static final int SENDKONFETTIMODE_JUSTEARNED = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /*
     * DESCRIBING DATA
     */

    // name of party to display
    private String name;
    
    // detail text (can contain basic HTML)
    // for e.g. address to show for editorial info
    private String detailText;

    // website http-address or email for further info
    // optional but should be seperate field so client can offer options
    private String contact;
    
    /*
     * PARTY SETTINGS
     */
    
    // determines the visibilty of the party to new users
    // see final values VISIBILITY_* above
    private int visibility = 0;
    
    // determines if orga admins need to review public posting
    // see final values REVIEWLEVEL_* above
    private int reviewLevel = 0;
    
    // minimal konfetti to spend on new request posting
    private int newRequestMinKonfetti = 0;
    
    // konfetti amount a new user gets 
    private long welcomeBalance = 0;

    /*
     * GEO DATA
     * is a GPS coordinate (lat/lon) together with a radius in meter
     * just if user within this radius party will be shown
     */
    
    private Float lon;
    private Float lat;
    private int meters;
    
    /*
     * SEND KONFETTI
     * feature to send konfetti to other users
     * for mode use SENDKONFETTIMODE_* (see above)
     * if any value is set on white list its activated
     * white list is a list of e-mail addresses only allowed to send to
     */
    
    private Integer sendKonfettiMode;
    private String[] sendKonfettiWhiteList;

    /*
     * TRANSIENT DATA
     * just be delivered to client on REST end point
     */
    
    @Transient // how many konfetti has calling user personally on this party
    private long konfettiCount;
    @Transient // how many konfetti can be send if feature is enabled
    private long sendKonfettiMaxAmount;
    @Transient // how many konfetti calling user earned total on this party
    private long konfettiTotal;
    @Transient // which ranking place the calling user has on this party   
    private int topPosition;
    
    @Transient // requests (tasks) relevant for this party
    private Set<Request> requests;
    
	@Transient // notification relevant for this party and user
    private Set<Notification> notifications;
    
    /*
     * METHODS 
     */
    
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Float getLon() {
        return lon;
    }

    public void setLon(Float lon) {
        this.lon = lon;
    }

    public Float getLat() {
        return lat;
    }

    public void setLat(Float lat) {
        this.lat = lat;
    }

    public int getMeters() {
        return meters;
    }

    public void setMeters(int meters) {
        this.meters = meters;
    }

    public long getKonfettiCount() {
        return konfettiCount;
    }

    public void setKonfettiCount(long konfettiCount) {
        this.konfettiCount = konfettiCount;
    }

    public long getKonfettiTotal() {
        return konfettiTotal;
    }

    public void setKonfettiTotal(long konfettiTotal) {
        this.konfettiTotal = konfettiTotal;
    }

    public int getTopPosition() {
        return topPosition;
    }

    public void setTopPosition(int topClass) {
        this.topPosition = topClass;
    }

	public String getContact() {
		return contact;
	}

	public void setContact(String contact) {
		this.contact = contact;
	}

	public int getNewRequestMinKonfetti() {
		return newRequestMinKonfetti;
	}

	public void setNewRequestMinKonfetti(int newRequestMinKonfetti) {
		this.newRequestMinKonfetti = newRequestMinKonfetti;
	}

	public int getReviewLevel() {
		return reviewLevel;
	}

	public void setReviewLevel(int reviewLevel) {
		this.reviewLevel = reviewLevel;
	}

	public int getVisibility() {
		return visibility;
	}

	public void setVisibility(int visibility) {
		this.visibility = visibility;
	}

	public String getDetailText() {
		return detailText;
	}

	public void setDetailText(String detailText) {
		this.detailText = detailText;
	}
	
    public Set<Request> getRequests() {
		return requests;
	}

	public void setRequests(Set<Request> requests) {
		this.requests = requests;
	}

	public Set<Notification> getNotifications() {
		return notifications;
	}

	public void setNotifications(Set<Notification> notifications) {
		this.notifications = notifications;
	}

	public long getWelcomeBalance() {
		return welcomeBalance;
	}

	public void setWelcomeBalance(long welcomeBalance) {
		this.welcomeBalance = welcomeBalance;
	}

	public String[] getSendKonfettiWhiteList() {
		if (sendKonfettiWhiteList==null) return new String[0];
		return sendKonfettiWhiteList;
	}

	public void setSendKonfettiWhiteList(String[] sendKonfettiWhiteList) {
		this.sendKonfettiWhiteList = sendKonfettiWhiteList;
	}

	public Integer getSendKonfettiMode() {
		if (sendKonfettiMode==null) return SENDKONFETTIMODE_DISABLED;
		return sendKonfettiMode;
	}

	public void setSendKonfettiMode(Integer sendKonfettiMode) {
		this.sendKonfettiMode = sendKonfettiMode;
	}

	public long getSendKonfettiMaxAmount() {
		return sendKonfettiMaxAmount;
	}

	public void setSendKonfettiMaxAmount(long sendKonfettiMaxAmount) {
		this.sendKonfettiMaxAmount = sendKonfettiMaxAmount;
	}
}
