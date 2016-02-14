package de.konfetti.utils;

import java.io.InputStream;
import java.util.Properties;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.konfetti.data.mediaitem.LangData;
import de.konfetti.data.mediaitem.MultiLang;

import com.google.api.GoogleAPI;
import com.google.api.translate.Language;
import com.google.api.translate.Translate;


public class AutoTranslator {

	private static final Logger LOGGER = LoggerFactory.getLogger(AutoTranslator.class);
	
	/*
	 * LANGUAGE CODES
	 */
	
	public static final String LANGCODE_GERMAN = "de";
	public static final String LANGCODE_ENGLISH = "en";
	public static final String LANGCODE_ARABIC = "ar";
	public static final String[] SUPPORTED_LANGCODES = {LANGCODE_GERMAN, LANGCODE_ENGLISH, LANGCODE_ARABIC};
	
	/*
	 * SINGLETON
	 */
	
	private static AutoTranslator singleton = null;
	
	private AutoTranslator() {
		
		String ApiKey = Helper.getPropValues("googletranslate.apikey");
		if (ApiKey==null) throw new RuntimeException("please set 'googletranslate.apikey' in 'application.properties'");
		LOGGER.info("Got API-KEY: "+ApiKey);
		
		// TODO: get API key from config not stored on GitHub
		GoogleAPI.setHttpReferrer("http://www.konfettiapp.de/api");
	    GoogleAPI.setKey(ApiKey);		
	}
	
	public static AutoTranslator getInstance() {
		if (singleton==null) singleton = new AutoTranslator();
		return singleton;
	}
	
	/*
	 * METHODS
	 */
	
	public MultiLang translate(String langCode, String text) throws Exception {
		
		// check if language is supported
		if (!isLanguageSupported(langCode)) throw new Exception("language("+langCode+") is not supported by AutoTranslator");
		
		// prepare basic result object
		MultiLang result = new MultiLang();
		LangData org = new LangData();
		org.text = text;
		org.translator = LangData.ORIGIN_ORGINAL;
		result.put(langCode, org);
		
		// go thru all supported languages
		for (String toLangCode : SUPPORTED_LANGCODES) {
			
			if (toLangCode.equals(langCode)) continue;
			
			try {
				
				Language fromLang = getGoogleLanguageFromLangCode(langCode);
				Language toLang = getGoogleLanguageFromLangCode(toLangCode);
				String translatedText = Translate.DEFAULT.execute(text, fromLang, toLang);
				LOGGER.info("Google Translate "+langCode+"->"+toLangCode+" text("+text+") --> ("+translatedText+")"); 
				
				LangData langData = new LangData();
				langData.text = translatedText;
				langData.translator = LangData.ORIGIN_GOOGLE;
				result.put(toLangCode, langData);
				
			} catch (Exception e) {
			    e.printStackTrace();
			}
			
		}
				
		return result;
	}
	
	public MultiLang reTranslate(MultiLang multiLang) throws Exception {
		
		// find orginal
		String orgLangCode = null;
		String orgText = null;
		Set<String> keys = multiLang.keySet();
		for (String key : keys) {
			LangData langData = multiLang.get(key);
			if (langData.translator==LangData.ORIGIN_ORGINAL) {
				orgLangCode = key;
				orgText = langData.text;
			}
		}
		
		// exception if no original was found
		if ((orgLangCode==null) || (orgText==null)) throw new Exception("no translator==0 found");
		
		return translate(orgLangCode, orgText);
	}
	
	public boolean isLanguageSupported(String langCode) {
		boolean isSupported = false;
		for (int i=0; i<SUPPORTED_LANGCODES.length; i++) {
			if (SUPPORTED_LANGCODES[i].equals(langCode)) {
				isSupported = true;
				break;
			}
		}
		return isSupported;
	}
	
	private Language getGoogleLanguageFromLangCode(String langCode) throws Exception {
		if (langCode.equals(LANGCODE_ENGLISH)) return Language.ENGLISH;
		if (langCode.equals(LANGCODE_GERMAN)) return Language.GERMAN;			
		if (langCode.equals(LANGCODE_ARABIC)) return Language.ARABIC;	
		throw new Exception("TODO: map own langCode("+langCode+") to GOOGLE LANGUAGE object");
	}
	
}
