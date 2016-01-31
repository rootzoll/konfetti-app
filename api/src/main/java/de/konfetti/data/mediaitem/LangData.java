package de.konfetti.data.mediaitem;

// part of MediaItemMultiLang
public class LangData {
	
	public static final long ORIGIN_ORGINAL = 0;
	public static final long ORIGIN_FAKE = -1;
	public static final long ORIGIN_GOOGLE = -2;
	
	// the text in given lang
	public String text;
	
	// is one of finals above or user id of translator
	public Long translator;
}
