package de.konfetti.data;

import javax.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Request {

	// possible sates of an request
	public static final String STATE_REVIEW = "review";
	public static final String STATE_REJECTED = "rejected";
	public static final String STATE_OPEN = "open";
	public static final String STATE_PROCESSING = "processing";
	public static final String STATE_DONE = "done";
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long partyId;
    
    private String state;
    
    private String title;
    
    private Long titleMultiLangRef;
    
	private Long time;
    
    /*
     * Hard Copy
     * Some data fields like user name and image are a hard copy from user and does not update when changed on user object
     * thats because a request object should not be changed on public visible info after a review was done
     */
    
    // hard copy from user
    private String userName;
    
    // hard copy from user
    private String imageUrl;
    
    // hard copy from user
    private String[] spokenLangs;
 
    
    /*
     * Transient Data
     */

    @Transient // --> get from accounting
    private long konfettiCount;

    @Transient // --> just for transport
    private long konfettiAdd;
    
    @Transient // --> for delivery
    private List<Chat> chats = new ArrayList<Chat>();
    
	@Transient // --> for delivery
    private List<MediaItem> info = new ArrayList<MediaItem>();

	@Transient // --> just for delivery
	private MediaItem titleMultiLang;
	
	
    public MediaItem getTitleMultiLang() {
		return titleMultiLang;
	}

	public void setTitleMultiLang(MediaItem titleMultiLang) {
		this.titleMultiLang = titleMultiLang;
	}

	public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public long getKonfettiCount() {
        return konfettiCount;
    }

    public void setKonfettiCount(long konfettiCount) {
        this.konfettiCount = konfettiCount;
    }

    public long getKonfettiAdd() {
        return konfettiAdd;
    }

    public void setKonfettiAdd(long konfettiAdd) {
        this.konfettiAdd = konfettiAdd;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

	public Long getTime() {
		return time;
	}

	public void setTime(Long time) {
		this.time = time;
	}

	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	public Long getUserId() {
		return userId;
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

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String[] getSpokenLangs() {
		return spokenLangs;
	}

	public void setSpokenLangs(String[] spokenLangs) {
		this.spokenLangs = spokenLangs;
	}
	
    public List<Chat> getChats() {
		return chats;
	}

	public void setChats(List<Chat> chats) {
		this.chats = chats;
	}

	public List<MediaItem> getInfo() {
		return info;
	}

	public void setInfo(List<MediaItem> info) {
		this.info = info;
	}
	
	public Long getTitleMultiLangRef() {
		return titleMultiLangRef;
	}

	public void setTitleMultiLangRef(Long titleMultiLangRef) {
		this.titleMultiLangRef = titleMultiLangRef;
	}

}
