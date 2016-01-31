package de.konfetti.data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class MediaItem {

	public static final String TYPE_UNKOWN = "n/a";
	public static final String TYPE_TEXT = "java.lang.String";
	public static final String TYPE_MULTILANG = "MediaItemMultiLang";
	
	public static final Integer REVIEWED_PUBLIC = 0;
	public static final Integer REVIEWED_PRIVATE = 1;
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // uploader
    private Long userId = 0l;
    
    // info if can be displayed to public
    private Integer reviewed = 0;
    
    private Long lastUpdateTS = 0l; 
    
    private String type = TYPE_UNKOWN; 
    
    // JSON or BASE64
    private String data = ""; 
    
    /*
     * METHODS
     */

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Integer getReviewed() {
		return reviewed;
	}

	public void setReviewed(Integer reviewed) {
		this.reviewed = reviewed;
	}

	public Long getLastUpdateTS() {
		return lastUpdateTS;
	}

	public void setLastUpdateTS(Long lastUpdateTS) {
		this.lastUpdateTS = lastUpdateTS;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getData() {
		return data;
	}

	public void setData(String data) {
		this.data = data;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}
	
}
