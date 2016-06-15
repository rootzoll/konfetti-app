package de.konfetti.data;

import lombok.Data;

import javax.persistence.*;

@Data
@Entity
public class MediaItem {

	public static final String TYPE_UNKOWN = "n/a";
	public static final String TYPE_TEXT = "java.lang.String";
	public static final String TYPE_MULTILANG = "MediaItemMultiLang";
	public static final String TYPE_LOCATION = "Location";
	public static final String TYPE_IMAGE = "Image";
	public static final String TYPE_DATE = "Date";
	
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
    @Lob
    @Column(length = 1000000)
	private String data = "";
}
